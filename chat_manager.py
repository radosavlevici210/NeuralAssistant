"""
AVA CORE Chat Manager
Copyright and Trademark: Ervin Radosavlevici

Secure chat management with privacy controls and automatic conversation initiation
"""

import uuid
import time
import threading
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

logger = logging.getLogger(__name__)

class ChatSession:
    """Individual chat session with privacy controls"""
    
    def __init__(self, session_id: str, user_id: str = None):
        self.session_id = session_id
        self.user_id = user_id or f"user_{int(time.time())}"
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.messages = []
        self.is_active = True
        self.privacy_mode = True
        self.permissions = {
            'chat_only': True,
            'voice_access': False,
            'system_access': False,
            'file_access': False,
            'device_control': False
        }
        self.conversation_context = []
        
    def add_message(self, speaker: str, message: str, message_type: str = "text"):
        """Add message to session with timestamp"""
        msg = {
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'speaker': speaker,
            'message': message,
            'type': message_type,
            'session_id': self.session_id
        }
        self.messages.append(msg)
        self.last_activity = datetime.now()
        
        # Keep conversation context for AI
        if len(self.conversation_context) > 10:  # Limit context to last 10 exchanges
            self.conversation_context = self.conversation_context[-8:]
        
        self.conversation_context.append({
            'role': 'user' if speaker == 'User' else 'assistant',
            'content': message
        })
        
        return msg
    
    def get_recent_messages(self, limit: int = 20) -> List[dict]:
        """Get recent messages from session"""
        return self.messages[-limit:] if self.messages else []
    
    def is_expired(self, timeout_minutes: int = 30) -> bool:
        """Check if session has expired due to inactivity"""
        return datetime.now() - self.last_activity > timedelta(minutes=timeout_minutes)
    
    def to_dict(self) -> dict:
        """Convert session to dictionary"""
        return {
            'session_id': self.session_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'is_active': self.is_active,
            'privacy_mode': self.privacy_mode,
            'permissions': self.permissions,
            'message_count': len(self.messages)
        }

class AutoChatManager:
    """Manages automatic chat initiation and privacy controls"""
    
    def __init__(self, socketio_instance=None):
        self.socketio = socketio_instance
        self.active_sessions: Dict[str, ChatSession] = {}
        self.user_sessions: Dict[str, List[str]] = {}  # user_id -> [session_ids]
        self.auto_greeting_enabled = True
        self.privacy_enforced = True
        self.cleanup_thread = None
        self.start_cleanup_scheduler()
        
        # Auto-chat settings
        self.auto_responses = {
            'greeting': [
                "Hello! I'm AVA, your AI assistant. How can I help you today?",
                "Hi there! I'm here to chat and assist you. What would you like to talk about?",
                "Welcome! I'm AVA. Feel free to ask me anything or just chat."
            ],
            'idle': [
                "Is there anything else I can help you with?",
                "I'm here if you need any assistance or just want to chat.",
                "Feel free to ask me about anything - I'm here to help!"
            ],
            'farewell': [
                "Thank you for chatting with me! Feel free to come back anytime.",
                "It was great talking with you. I'm always here when you need me!",
                "Goodbye for now! I'll be here whenever you want to chat again."
            ]
        }
        
    def create_session(self, user_id: str = None) -> ChatSession:
        """Create new secure chat session"""
        session_id = str(uuid.uuid4())
        session = ChatSession(session_id, user_id)
        
        self.active_sessions[session_id] = session
        
        if user_id:
            if user_id not in self.user_sessions:
                self.user_sessions[user_id] = []
            self.user_sessions[user_id].append(session_id)
        
        logger.info(f"Created new chat session: {session_id}")
        
        # Send automatic greeting if enabled
        if self.auto_greeting_enabled:
            self.send_auto_greeting(session)
        
        return session
    
    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get existing session"""
        return self.active_sessions.get(session_id)
    
    def get_user_sessions(self, user_id: str) -> List[ChatSession]:
        """Get all sessions for a user"""
        session_ids = self.user_sessions.get(user_id, [])
        return [self.active_sessions[sid] for sid in session_ids if sid in self.active_sessions]
    
    def send_auto_greeting(self, session: ChatSession):
        """Send automatic greeting to new session"""
        import random
        greeting = random.choice(self.auto_responses['greeting'])
        message = session.add_message("AVA", greeting, "auto_greeting")
        
        # Emit to specific session via WebSocket
        if self.socketio:
            self.socketio.emit('chat_message', {
                'session_id': session.session_id,
                'message': message,
                'type': 'auto_greeting'
            }, room=session.session_id)
        
        logger.info(f"Auto greeting sent to session {session.session_id}")
    
    def send_idle_prompt(self, session: ChatSession):
        """Send idle conversation prompt"""
        if not session.is_active:
            return
            
        import random
        idle_msg = random.choice(self.auto_responses['idle'])
        message = session.add_message("AVA", idle_msg, "idle_prompt")
        
        if self.socketio:
            self.socketio.emit('chat_message', {
                'session_id': session.session_id,
                'message': message,
                'type': 'idle_prompt'
            }, room=session.session_id)
    
    def process_user_message(self, session_id: str, user_message: str, advanced_ai=None):
        """Process user message with privacy controls"""
        session = self.get_session(session_id)
        if not session:
            logger.error(f"Session not found: {session_id}")
            return None
        
        # Add user message
        user_msg = session.add_message("User", user_message)
        
        # Generate AI response with privacy controls
        try:
            if advanced_ai and session.permissions['chat_only']:
                # Only allow chat, no system access
                ai_response = advanced_ai.generate_contextual_response(
                    user_message, 
                    intent="conversation",
                    context=session.conversation_context
                )
            else:
                ai_response = f"I'm here to chat with you! Your message: {user_message}"
            
            # Add AI response
            ai_msg = session.add_message("AVA", ai_response, "response")
            
            # Emit to WebSocket
            if self.socketio:
                self.socketio.emit('chat_message', {
                    'session_id': session_id,
                    'user_message': user_msg,
                    'ai_response': ai_msg,
                    'type': 'conversation'
                }, room=session_id)
            
            return {
                'user_message': user_msg,
                'ai_response': ai_msg,
                'session_info': session.to_dict()
            }
            
        except Exception as e:
            logger.error(f"Error processing message: {str(e)}")
            error_msg = session.add_message("AVA", "I'm having trouble responding right now. Please try again.", "error")
            return {'error': str(e), 'error_message': error_msg}
    
    def end_session(self, session_id: str):
        """End chat session with farewell"""
        session = self.get_session(session_id)
        if not session:
            return
        
        import random
        farewell = random.choice(self.auto_responses['farewell'])
        session.add_message("AVA", farewell, "farewell")
        session.is_active = False
        
        if self.socketio:
            self.socketio.emit('session_ended', {
                'session_id': session_id,
                'farewell_message': farewell
            }, room=session_id)
        
        # Clean up after delay
        threading.Timer(60, lambda: self.cleanup_session(session_id)).start()
    
    def cleanup_session(self, session_id: str):
        """Remove session from memory"""
        if session_id in self.active_sessions:
            session = self.active_sessions[session_id]
            
            # Remove from user sessions
            if session.user_id in self.user_sessions:
                if session_id in self.user_sessions[session.user_id]:
                    self.user_sessions[session.user_id].remove(session_id)
                if not self.user_sessions[session.user_id]:
                    del self.user_sessions[session.user_id]
            
            del self.active_sessions[session_id]
            logger.info(f"Cleaned up session: {session_id}")
    
    def start_cleanup_scheduler(self):
        """Start automatic session cleanup"""
        def cleanup_expired():
            while True:
                try:
                    expired_sessions = []
                    for session_id, session in self.active_sessions.items():
                        if session.is_expired():
                            expired_sessions.append(session_id)
                    
                    for session_id in expired_sessions:
                        self.end_session(session_id)
                    
                    time.sleep(300)  # Check every 5 minutes
                    
                except Exception as e:
                    logger.error(f"Cleanup error: {str(e)}")
                    time.sleep(60)
        
        self.cleanup_thread = threading.Thread(target=cleanup_expired, daemon=True)
        self.cleanup_thread.start()
    
    def get_active_sessions_count(self) -> int:
        """Get count of active sessions"""
        return len([s for s in self.active_sessions.values() if s.is_active])
    
    def get_session_stats(self) -> dict:
        """Get statistics about chat sessions"""
        total_sessions = len(self.active_sessions)
        active_sessions = self.get_active_sessions_count()
        total_messages = sum(len(s.messages) for s in self.active_sessions.values())
        
        return {
            'total_sessions': total_sessions,
            'active_sessions': active_sessions,
            'total_messages': total_messages,
            'unique_users': len(self.user_sessions),
            'privacy_enforced': self.privacy_enforced,
            'auto_greeting_enabled': self.auto_greeting_enabled
        }
    
    def enforce_privacy(self, session_id: str, message: str) -> bool:
        """Check if message violates privacy controls"""
        if not self.privacy_enforced:
            return True
        
        # Block system access attempts
        blocked_terms = [
            'shell', 'console', 'terminal', 'cmd', 'bash',
            'file system', 'directory', 'folder', 'delete',
            'install', 'sudo', 'admin', 'root', 'password'
        ]
        
        message_lower = message.lower()
        for term in blocked_terms:
            if term in message_lower:
                logger.warning(f"Privacy violation attempt in session {session_id}: {term}")
                return False
        
        return True
    
    def set_session_permissions(self, session_id: str, permissions: dict):
        """Update session permissions"""
        session = self.get_session(session_id)
        if session:
            session.permissions.update(permissions)
            logger.info(f"Updated permissions for session {session_id}: {permissions}")
    
    def get_conversation_for_session(self, session_id: str, limit: int = 50) -> List[dict]:
        """Get conversation history for specific session"""
        session = self.get_session(session_id)
        if session:
            return session.get_recent_messages(limit)
        return []