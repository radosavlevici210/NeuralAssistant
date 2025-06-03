"""
AVA CORE: Neural AI Voice Assistant
Copyright and Trademark: Ervin Radosavlevici

A sophisticated voice assistant with speech recognition, AI conversation, and text-to-speech capabilities.
Features real-time web monitoring and WebSocket integration.
"""

import json
import os
import threading
import time
from datetime import datetime
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import logging

from voice_assistant import VoiceAssistant

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ava-core-secret-key')

# Initialize SocketIO for real-time communication
socketio = SocketIO(app, cors_allowed_origins="*", path='/ws')

# Global voice assistant instance
voice_assistant = None
assistant_thread = None
is_listening = False

# Conversation history for web interface
conversation_history = []
max_history = 50

class WebVoiceAssistant:
    """Web interface wrapper for the voice assistant"""
    
    def __init__(self, socketio_instance):
        self.socketio = socketio_instance
        self.voice_assistant = VoiceAssistant()
        self.is_active = False
        
    def log_conversation(self, speaker, message, timestamp=None):
        """Log conversation to history and emit to web clients"""
        if timestamp is None:
            timestamp = datetime.now().strftime("%H:%M:%S")
        
        entry = {
            'speaker': speaker,
            'message': message,
            'timestamp': timestamp
        }
        
        conversation_history.append(entry)
        
        # Keep only recent conversations
        if len(conversation_history) > max_history:
            conversation_history.pop(0)
        
        # Emit to web clients
        self.socketio.emit('conversation_update', entry)
        
    def status_update(self, status, details=None):
        """Send status updates to web clients"""
        update = {
            'status': status,
            'details': details,
            'timestamp': datetime.now().strftime("%H:%M:%S")
        }
        self.socketio.emit('status_update', update)
        logger.info(f"Status: {status} - {details}")
        
    def start_listening(self):
        """Start the voice assistant listening loop"""
        self.is_active = True
        self.status_update("started", "AVA CORE is now listening...")
        
        while self.is_active:
            try:
                self.status_update("listening", "Listening for voice input...")
                
                # Get speech input
                user_input = self.voice_assistant.listen_for_speech()
                
                if user_input:
                    self.log_conversation("User", user_input)
                    self.status_update("processing", "Generating AI response...")
                    
                    # Generate AI response
                    ai_response = self.voice_assistant.get_ai_response(user_input)
                    
                    if ai_response:
                        self.log_conversation("AVA", ai_response)
                        self.status_update("speaking", "Speaking response...")
                        
                        # Speak the response
                        self.voice_assistant.speak_text(ai_response)
                        
                        self.status_update("ready", "Ready for next input")
                    else:
                        self.status_update("error", "Failed to generate response")
                        
                else:
                    self.status_update("no_input", "No speech detected, continuing to listen...")
                    
                # Short pause between listening cycles
                time.sleep(0.5)
                
            except Exception as e:
                error_msg = f"Voice assistant error: {str(e)}"
                self.status_update("error", error_msg)
                logger.error(error_msg)
                time.sleep(2)  # Wait before retrying
                
    def stop_listening(self):
        """Stop the voice assistant"""
        self.is_active = False
        self.status_update("stopped", "AVA CORE has been stopped")

# Initialize web voice assistant
web_assistant = WebVoiceAssistant(socketio)

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('index.html')

@app.route('/monitor')
def monitor():
    """Conversation monitoring page"""
    return render_template('monitor.html')

@app.route('/api/status')
def get_status():
    """Get current assistant status"""
    global assistant_thread, is_listening
    
    status = {
        'is_listening': is_listening and assistant_thread and assistant_thread.is_alive(),
        'conversation_count': len(conversation_history),
        'last_activity': conversation_history[-1]['timestamp'] if conversation_history else None
    }
    return jsonify(status)

@app.route('/api/conversation')
def get_conversation():
    """Get conversation history"""
    return jsonify(conversation_history)

@app.route('/api/start', methods=['POST'])
def start_assistant():
    """Start the voice assistant"""
    global assistant_thread, is_listening
    
    try:
        if assistant_thread and assistant_thread.is_alive():
            return jsonify({'error': 'Assistant already running'}), 400
        
        is_listening = True
        assistant_thread = threading.Thread(target=web_assistant.start_listening, daemon=True)
        assistant_thread.start()
        
        return jsonify({'success': True, 'message': 'AVA CORE started successfully'})
        
    except Exception as e:
        logger.error(f"Failed to start assistant: {str(e)}")
        return jsonify({'error': f'Failed to start assistant: {str(e)}'}), 500

@app.route('/api/stop', methods=['POST'])
def stop_assistant():
    """Stop the voice assistant"""
    global is_listening
    
    try:
        is_listening = False
        web_assistant.stop_listening()
        return jsonify({'success': True, 'message': 'AVA CORE stopped successfully'})
        
    except Exception as e:
        logger.error(f"Failed to stop assistant: {str(e)}")
        return jsonify({'error': f'Failed to stop assistant: {str(e)}'}), 500

@app.route('/api/speak', methods=['POST'])
def manual_speak():
    """Manually make AVA speak text"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        web_assistant.log_conversation("Manual", f"Speaking: {text}")
        web_assistant.voice_assistant.speak_text(text)
        
        return jsonify({'success': True, 'message': 'Text spoken successfully'})
        
    except Exception as e:
        logger.error(f"Failed to speak text: {str(e)}")
        return jsonify({'error': f'Failed to speak text: {str(e)}'}), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected to WebSocket")
    emit('connection_status', {'status': 'connected', 'message': 'Connected to AVA CORE'})
    
    # Send current conversation history
    for entry in conversation_history:
        emit('conversation_update', entry)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected from WebSocket")

if __name__ == '__main__':
    print("=" * 60)
    print("AVA CORE: Neural AI Voice Assistant")
    print("Copyright and Trademark: Ervin Radosavlevici")
    print("=" * 60)
    print(f"Starting web interface on http://0.0.0.0:5000")
    print("Dashboard: http://0.0.0.0:5000")
    print("Monitor: http://0.0.0.0:5000/monitor")
    print("=" * 60)
    
    # Run the Flask-SocketIO app
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)
