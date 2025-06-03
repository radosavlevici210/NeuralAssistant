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
from network_discovery import NetworkDiscovery
from chat_manager import AutoChatManager
from cloud_deploy import CloudDeploymentManager
from automation_controller import AutomationController
from self_management import AVACoreSelfManagement
from development_suite import AdvancedDevelopmentSuite
from advanced_capabilities import AdvancedCapabilities

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

# Initialize web voice assistant, network discovery, secure chat manager, cloud deployment, automation, self-management, and development suite
web_assistant = WebVoiceAssistant(socketio)
network_discovery = NetworkDiscovery(ava_port=5000)
chat_manager = AutoChatManager(socketio)
cloud_deployer = CloudDeploymentManager()
automation_controller = AutomationController()
self_management = AVACoreSelfManagement("ervin210@icloud.com")
development_suite = AdvancedDevelopmentSuite()
advanced_capabilities = AdvancedCapabilities()

@app.route('/')
def index():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/classic')
def classic():
    """Classic interface"""
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

@app.route('/api/chat', methods=['POST'])
def chat_with_ava():
    """Secure chat with AVA using privacy controls"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Create or get secure session
        if not session_id:
            session = chat_manager.create_session()
            session_id = session.session_id
        else:
            session = chat_manager.get_session(session_id)
            if not session:
                session = chat_manager.create_session()
                session_id = session.session_id
        
        # Privacy control - block system access attempts
        blocked_terms = ['shell', 'console', 'terminal', 'cmd', 'bash', 'sudo', 'admin', 'root']
        if any(term in message.lower() for term in blocked_terms):
            return jsonify({
                'error': 'Access denied - chat only mode enabled for privacy',
                'session_id': session_id
            }), 403
        
        # Check if this is an automation command
        automation_keywords = ['fix', 'setup', 'control', 'take control', 'do this', 'navigate', 'open', 'close', 'install', 'create', 'run', 'execute']
        is_automation_request = any(keyword in message.lower() for keyword in automation_keywords)
        
        if is_automation_request:
            # Execute automation task
            automation_result = automation_controller.execute_computer_task(message, session_id)
            
            if automation_result.get('success'):
                ai_response = f"I've completed your automation task: {message}\n\nResult: {automation_result.get('result', {}).get('message', 'Task completed successfully')}"
            else:
                error_msg = automation_result.get('error', 'Unknown error')
                if 'permission' in error_msg.lower():
                    ai_response = f"I need permission to control your computer for this task: {message}\n\nTo enable computer control, please confirm you want AVA to have automation access."
                else:
                    ai_response = f"I encountered an issue with your automation task: {error_msg}\n\nLet me know if you'd like me to try a different approach."
            
            # Add to session
            session.add_message("User", message)
            ai_msg = session.add_message("AVA", ai_response)
            
            result = {
                'user_message': {'message': message},
                'ai_response': ai_msg,
                'automation_executed': True,
                'automation_result': automation_result
            }
        else:
            # Regular AI conversation
            from advanced_ai import AdvancedAI
            advanced_ai = AdvancedAI()
            result = chat_manager.process_user_message(session_id, message, advanced_ai)
        
        if result and 'error' not in result:
            # Also log for main system
            web_assistant.log_conversation("User", message)
            web_assistant.log_conversation("AVA", result['ai_response']['message'])
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'user_message': result['user_message'],
                'ai_response': result['ai_response'],
                'private_session': True,
                'timestamp': datetime.now().isoformat()
            })
        else:
            # Fallback to basic response if advanced AI fails
            fallback_response = f"I'm here to chat with you! You said: {message}"
            session.add_message("User", message)
            ai_msg = session.add_message("AVA", fallback_response)
            
            web_assistant.log_conversation("User", message)
            web_assistant.log_conversation("AVA", fallback_response)
            
            return jsonify({
                'success': True,
                'session_id': session_id,
                'response': fallback_response,
                'ai_response': ai_msg,
                'private_session': True,
                'fallback_mode': True
            })
        
    except Exception as e:
        logger.error(f"Failed to generate chat response: {str(e)}")
        return jsonify({'error': f'Failed to generate response: {str(e)}'}), 500

@app.route('/api/chat/session/new', methods=['POST'])
def create_chat_session():
    """Create new private chat session"""
    try:
        session = chat_manager.create_session()
        return jsonify({
            'session_id': session.session_id,
            'created_at': session.created_at.isoformat(),
            'privacy_mode': True,
            'permissions': session.permissions
        })
    except Exception as e:
        logger.error(f"Session creation error: {str(e)}")
        return jsonify({'error': f'Failed to create session: {str(e)}'}), 500

@app.route('/api/chat/session/<session_id>/messages')
def get_session_messages(session_id):
    """Get messages for specific session"""
    try:
        session = chat_manager.get_session(session_id)
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        messages = session.get_recent_messages(50)
        return jsonify({
            'session_id': session_id,
            'messages': messages,
            'privacy_mode': session.privacy_mode
        })
    except Exception as e:
        logger.error(f"Get messages error: {str(e)}")
        return jsonify({'error': f'Failed to get messages: {str(e)}'}), 500

@app.route('/api/device-control', methods=['POST'])
def device_control():
    """Execute device control commands"""
    try:
        data = request.get_json()
        command_type = data.get('command_type', '')
        parameters = data.get('parameters', {})
        
        if not command_type:
            return jsonify({'error': 'No command type provided'}), 400
        
        # Execute device control command
        result = web_assistant.voice_assistant.device_controller.execute_command(command_type, parameters)
        
        # Log the action
        web_assistant.log_conversation("System", f"Device control: {result.get('message', 'Command executed')}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Device control error: {str(e)}")
        return jsonify({'error': f'Device control failed: {str(e)}'}), 500

@app.route('/api/capabilities')
def get_capabilities():
    """Get AVA's current capabilities"""
    try:
        ai_capabilities = web_assistant.voice_assistant.advanced_ai.get_capabilities()
        device_commands = web_assistant.voice_assistant.device_controller.get_available_commands()
        
        capabilities = {
            'voice_recognition': web_assistant.voice_assistant.audio_available,
            'text_to_speech': web_assistant.voice_assistant.tts_engine is not None,
            'ai_capabilities': ai_capabilities,
            'device_commands': device_commands,
            'features': [
                'Natural conversation with context awareness',
                'Business and development advice',
                'Device control (open apps, browse web, file operations)',
                'Task analysis and breakdown',
                'Personalized recommendations',
                'Real-time monitoring and logging'
            ]
        }
        
        return jsonify(capabilities)
        
    except Exception as e:
        logger.error(f"Failed to get capabilities: {str(e)}")
        return jsonify({'error': f'Failed to get capabilities: {str(e)}'}), 500

@app.route('/api/network/discovery/start', methods=['POST'])
def start_network_discovery():
    """Start automatic network discovery"""
    try:
        result = network_discovery.start_discovery()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Network discovery start error: {str(e)}")
        return jsonify({'error': f'Failed to start discovery: {str(e)}'}), 500

@app.route('/api/network/discovery/stop', methods=['POST'])
def stop_network_discovery():
    """Stop network discovery"""
    try:
        result = network_discovery.stop_discovery()
        return jsonify(result)
    except Exception as e:
        logger.error(f"Network discovery stop error: {str(e)}")
        return jsonify({'error': f'Failed to stop discovery: {str(e)}'}), 500

@app.route('/api/network/status')
def get_network_status():
    """Get network discovery status and discovered devices"""
    try:
        status = network_discovery.get_discovery_status()
        return jsonify(status)
    except Exception as e:
        logger.error(f"Network status error: {str(e)}")
        return jsonify({'error': f'Failed to get network status: {str(e)}'}), 500

@app.route('/api/network/connect', methods=['POST'])
def connect_to_device():
    """Connect to discovered network device"""
    try:
        data = request.get_json()
        ip_address = data.get('ip_address', '')
        
        if not ip_address:
            return jsonify({'error': 'No IP address provided'}), 400
        
        result = network_discovery.connect_to_device(ip_address)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Device connection error: {str(e)}")
        return jsonify({'error': f'Failed to connect to device: {str(e)}'}), 500

@app.route('/api/automation/execute', methods=['POST'])
def execute_automation_task():
    """Execute computer automation task"""
    try:
        data = request.get_json()
        task_description = data.get('task', '').strip()
        user_id = data.get('user_id', 'default_user')
        
        if not task_description:
            return jsonify({'error': 'No task description provided'}), 400
        
        # Execute the automation task
        result = automation_controller.execute_computer_task(task_description, user_id)
        
        # Log the automation task
        web_assistant.log_conversation("User", f"Automation request: {task_description}")
        if result.get('success'):
            web_assistant.log_conversation("AVA", f"Task completed successfully")
        else:
            web_assistant.log_conversation("AVA", f"Task failed: {result.get('error', 'Unknown error')}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Automation execution error: {str(e)}")
        return jsonify({'error': f'Automation failed: {str(e)}'}), 500

@app.route('/api/automation/permissions', methods=['POST'])
def request_automation_permissions():
    """Request automation permissions"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default_user')
        permissions = data.get('permissions', [])
        
        result = automation_controller.request_permissions(user_id, permissions)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Permission request error: {str(e)}")
        return jsonify({'error': f'Permission request failed: {str(e)}'}), 500

@app.route('/api/automation/capabilities')
def get_automation_capabilities():
    """Get available automation capabilities"""
    try:
        capabilities = automation_controller.get_automation_capabilities()
        return jsonify(capabilities)
        
    except Exception as e:
        logger.error(f"Get capabilities error: {str(e)}")
        return jsonify({'error': f'Failed to get capabilities: {str(e)}'}), 500

@app.route('/api/automation/history')
def get_automation_history():
    """Get automation task history"""
    try:
        user_id = request.args.get('user_id', 'default_user')
        history = automation_controller.get_automation_history(user_id)
        return jsonify({'history': history})
        
    except Exception as e:
        logger.error(f"Get history error: {str(e)}")
        return jsonify({'error': f'Failed to get history: {str(e)}'}), 500

@app.route('/api/self-management/status')
def get_self_management_status():
    """Get comprehensive self-management system status"""
    try:
        status = self_management.get_comprehensive_status()
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/self-management/memory/conversation', methods=['POST'])
def store_conversation():
    """Store conversation in persistent memory"""
    try:
        data = request.get_json()
        speaker = data.get('speaker', 'Unknown')
        message = data.get('message', '')
        context = data.get('context', {})
        
        self_management.memory.remember_conversation(speaker, message, context)
        return jsonify({'success': True, 'message': 'Conversation stored in persistent memory'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/memory/history')
def get_memory_history():
    """Get conversation history from persistent memory"""
    try:
        limit = int(request.args.get('limit', 100))
        history = self_management.memory.get_conversation_history(limit)
        return jsonify({
            'success': True,
            'history': history
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/repair/status')
def get_repair_status():
    """Get system repair status"""
    try:
        health_status = self_management.repair_system.perform_health_check()
        return jsonify({
            'success': True,
            'health_status': health_status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/upgrade/check')
def check_upgrades():
    """Check for available system upgrades"""
    try:
        upgrade_status = self_management.upgrade_system.check_for_upgrades()
        return jsonify({
            'success': True,
            'upgrade_status': upgrade_status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/upgrade/perform', methods=['POST'])
def perform_upgrade():
    """Perform system self-upgrade"""
    try:
        upgrade_result = self_management.upgrade_system.perform_self_upgrade()
        return jsonify({
            'success': True,
            'upgrade_result': upgrade_result
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/defense/status')
def get_defense_status():
    """Get security defense status"""
    try:
        security_status = self_management.defense_system.get_security_status()
        return jsonify({
            'success': True,
            'security_status': security_status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/work/external', methods=['POST'])
def process_external_work():
    """Process external work requests"""
    try:
        data = request.get_json()
        task_description = data.get('task_description', '')
        task_type = data.get('task_type', 'general')
        
        result = self_management.process_external_work_request(task_description, task_type)
        return jsonify({
            'success': True,
            'result': result
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/self-management/learn', methods=['POST'])
def learn_behavior():
    """Learn new behavioral patterns"""
    try:
        data = request.get_json()
        pattern = data.get('pattern', '')
        context = data.get('context', {})
        effectiveness = data.get('effectiveness', 0.5)
        
        self_management.memory.learn_behavior(pattern, context, effectiveness)
        return jsonify({'success': True, 'message': 'Behavior pattern learned'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/status')
def get_development_status():
    """Get development suite status"""
    try:
        status = development_suite.get_suite_status()
        return jsonify({
            'success': True,
            'status': status
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/secrets', methods=['GET'])
def list_secrets():
    """List all stored secrets"""
    try:
        secrets = development_suite.secret_manager.list_secrets()
        return jsonify({
            'success': True,
            'secrets': secrets
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/secrets', methods=['POST'])
def store_secret():
    """Store a new secret"""
    try:
        data = request.get_json()
        service_name = data.get('service_name', '')
        secret_value = data.get('secret_value', '')
        description = data.get('description', '')
        category = data.get('category', 'general')
        
        development_suite.secret_manager.store_secret(service_name, secret_value, description, category)
        return jsonify({
            'success': True,
            'message': f'Secret stored for {service_name}'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/secrets/<service_name>', methods=['DELETE'])
def delete_secret(service_name):
    """Delete a secret"""
    try:
        deleted = development_suite.secret_manager.delete_secret(service_name)
        if deleted:
            return jsonify({
                'success': True,
                'message': f'Secret {service_name} deleted'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Secret not found'
            }), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/session/start', methods=['POST'])
def start_dev_session():
    """Start development session"""
    try:
        result = development_suite.workflow.start_development_session()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/session/end', methods=['POST'])
def end_dev_session():
    """End development session"""
    try:
        result = development_suite.workflow.end_development_session()
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/project/create', methods=['POST'])
def create_project():
    """Create new development project"""
    try:
        data = request.get_json()
        project_name = data.get('project_name', '')
        project_type = data.get('project_type', 'generic')
        
        result = development_suite.workflow.create_project(project_name, project_type)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/git/commit', methods=['POST'])
def commit_changes():
    """Commit changes to git"""
    try:
        data = request.get_json()
        message = data.get('message', 'AVA CORE auto-commit')
        project_path = data.get('project_path', '.')
        
        result = development_suite.workflow.commit_changes(message, project_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/test/run', methods=['POST'])
def run_tests():
    """Run project tests"""
    try:
        data = request.get_json()
        project_path = data.get('project_path', '.')
        
        result = development_suite.workflow.run_tests(project_path)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/deploy', methods=['POST'])
def deploy_project():
    """Deploy project"""
    try:
        data = request.get_json()
        project_path = data.get('project_path', '.')
        deployment_target = data.get('target', 'heroku')
        
        result = development_suite.workflow.deploy_project(project_path, deployment_target)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/development/stats')
def get_dev_stats():
    """Get development statistics"""
    try:
        days = int(request.args.get('days', 30))
        stats = development_suite.workflow.get_development_stats(days)
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/advanced/browse', methods=['POST'])
def browse_website():
    """Browse external websites and extract information"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        extract_info = data.get('extract_info', 'text')
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'}), 400
        
        result = advanced_capabilities.browse_website(url, extract_info)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/advanced/execute', methods=['POST'])
def execute_external_request():
    """Execute various external requests"""
    try:
        data = request.get_json()
        request_type = data.get('request_type', '')
        details = data.get('details', {})
        
        if not request_type:
            return jsonify({'success': False, 'error': 'Request type is required'}), 400
        
        result = advanced_capabilities.process_external_request(request_type, details)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/advanced/capabilities')
def get_advanced_capabilities():
    """Get information about advanced capabilities"""
    try:
        capabilities = advanced_capabilities.get_capabilities()
        return jsonify({
            'success': True,
            'capabilities': capabilities
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/advanced/code/execute', methods=['POST'])
def execute_code():
    """Execute code in various languages"""
    try:
        data = request.get_json()
        language = data.get('language', 'python')
        code = data.get('code', '')
        
        if not code:
            return jsonify({'success': False, 'error': 'Code is required'}), 400
        
        result = advanced_capabilities.process_external_request('code_execution', {
            'language': language,
            'code': code
        })
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/advanced/api/call', methods=['POST'])
def call_external_api():
    """Call external APIs"""
    try:
        data = request.get_json()
        url = data.get('url', '')
        method = data.get('method', 'GET')
        headers = data.get('headers', {})
        payload = data.get('data', {})
        params = data.get('params', {})
        
        if not url:
            return jsonify({'success': False, 'error': 'URL is required'}), 400
        
        result = advanced_capabilities.process_external_request('api_call', {
            'url': url,
            'method': method,
            'headers': headers,
            'data': payload,
            'params': params
        })
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/advanced/data/process', methods=['POST'])
def process_data():
    """Process and transform data"""
    try:
        data = request.get_json()
        input_data = data.get('data', {})
        operation = data.get('operation', 'query')
        
        result = advanced_capabilities.process_external_request('data_processing', {
            'data': input_data,
            'operation': operation,
            'query': data.get('query'),
            'conditions': data.get('conditions', {}),
            'transformation': data.get('transformation')
        })
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
    
    # Start network discovery automatically
    try:
        print("Starting automatic network discovery...")
        discovery_result = network_discovery.start_discovery()
        if discovery_result['success']:
            print("✓ Network discovery active - AVA CORE is now discoverable on your network")
            print("✓ Devices on your network can now connect without installation")
        else:
            print("! Network discovery failed to start")
    except Exception as e:
        print(f"! Network discovery error: {str(e)}")
    
    print("=" * 60)
    
    # Run the Flask-SocketIO app
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True, use_reloader=False, log_output=False)
