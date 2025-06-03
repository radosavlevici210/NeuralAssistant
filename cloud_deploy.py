"""
AVA CORE Cloud Deployment Manager
Copyright and Trademark: Ervin Radosavlevici

Deploy AVA CORE to cloud platforms for internet hosting and mobile access
"""

import os
import json
import logging
import subprocess
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

class CloudDeploymentManager:
    """Manages cloud deployment of AVA CORE across platforms"""
    
    def __init__(self):
        self.deployment_configs = {
            'heroku': {
                'buildpack': 'python',
                'requirements': ['gunicorn', 'flask', 'flask-socketio'],
                'port_env': 'PORT',
                'host': '0.0.0.0'
            },
            'railway': {
                'buildpack': 'python',
                'requirements': ['gunicorn', 'flask', 'flask-socketio'],
                'port_env': 'PORT',
                'host': '0.0.0.0'
            },
            'render': {
                'buildpack': 'python',
                'requirements': ['gunicorn', 'flask', 'flask-socketio'],
                'port_env': 'PORT',
                'host': '0.0.0.0'
            },
            'vercel': {
                'runtime': 'python3.11',
                'framework': 'flask',
                'build_command': 'pip install -r requirements.txt'
            }
        }
        self.local_network_config = self._get_local_network_config()
    
    def _get_local_network_config(self) -> dict:
        """Get current local network configuration"""
        try:
            import socket
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            return {
                'hostname': hostname,
                'local_ip': local_ip,
                'port': 5000,
                'network_accessible': True
            }
        except Exception as e:
            logger.error(f"Failed to get network config: {str(e)}")
            return {'network_accessible': False}
    
    def create_deployment_files(self, platform: str) -> Dict[str, str]:
        """Create necessary deployment files for specified platform"""
        files_created = {}
        
        try:
            if platform == 'heroku':
                files_created.update(self._create_heroku_files())
            elif platform == 'railway':
                files_created.update(self._create_railway_files())
            elif platform == 'render':
                files_created.update(self._create_render_files())
            elif platform == 'vercel':
                files_created.update(self._create_vercel_files())
            else:
                raise ValueError(f"Unsupported platform: {platform}")
            
            # Create universal requirements.txt
            files_created['requirements.txt'] = self._create_requirements_file()
            
            # Create Procfile for most platforms
            if platform in ['heroku', 'railway', 'render']:
                files_created['Procfile'] = self._create_procfile()
            
            # Create deployment-optimized app.py
            files_created['app_cloud.py'] = self._create_cloud_app()
            
            logger.info(f"Created deployment files for {platform}")
            return files_created
            
        except Exception as e:
            logger.error(f"Failed to create deployment files: {str(e)}")
            return {}
    
    def _create_heroku_files(self) -> Dict[str, str]:
        """Create Heroku-specific deployment files"""
        files = {}
        
        # runtime.txt
        files['runtime.txt'] = "python-3.11.0"
        
        # app.json for Heroku Button
        app_json = {
            "name": "AVA CORE Neural AI Assistant",
            "description": "AI voice assistant with network discovery and secure chat",
            "repository": "https://github.com/your-repo/ava-core",
            "keywords": ["ai", "assistant", "voice", "chat", "neural"],
            "env": {
                "OPENAI_API_KEY": {
                    "description": "OpenAI API key for AI conversations",
                    "required": True
                },
                "FLASK_ENV": {
                    "description": "Flask environment",
                    "value": "production"
                }
            },
            "buildpacks": [
                {
                    "url": "heroku/python"
                }
            ]
        }
        files['app.json'] = json.dumps(app_json, indent=2)
        
        return files
    
    def _create_railway_files(self) -> Dict[str, str]:
        """Create Railway-specific deployment files"""
        files = {}
        
        # railway.toml
        railway_config = """[build]
builder = "nixpacks"

[deploy]
healthcheckPath = "/api/status"
restartPolicyType = "always"

[env]
RAILWAY_STATIC_URL = "true"
"""
        files['railway.toml'] = railway_config
        
        # nixpacks.toml
        nixpacks_config = """[phases.build]
cmds = ["pip install -r requirements.txt"]

[phases.start]
cmd = "gunicorn app_cloud:app --bind 0.0.0.0:$PORT --worker-class eventlet -w 1"
"""
        files['nixpacks.toml'] = nixpacks_config
        
        return files
    
    def _create_render_files(self) -> Dict[str, str]:
        """Create Render-specific deployment files"""
        files = {}
        
        # render.yaml
        render_config = {
            "services": [
                {
                    "type": "web",
                    "name": "ava-core",
                    "env": "python",
                    "plan": "free",
                    "buildCommand": "pip install -r requirements.txt",
                    "startCommand": "gunicorn app_cloud:app --bind 0.0.0.0:$PORT --worker-class eventlet -w 1",
                    "envVars": [
                        {
                            "key": "OPENAI_API_KEY",
                            "sync": False
                        }
                    ]
                }
            ]
        }
        files['render.yaml'] = json.dumps(render_config, indent=2)
        
        return files
    
    def _create_vercel_files(self) -> Dict[str, str]:
        """Create Vercel-specific deployment files"""
        files = {}
        
        # vercel.json
        vercel_config = {
            "version": 2,
            "builds": [
                {
                    "src": "app_cloud.py",
                    "use": "@vercel/python"
                }
            ],
            "routes": [
                {
                    "src": "/(.*)",
                    "dest": "app_cloud.py"
                }
            ],
            "env": {
                "OPENAI_API_KEY": "@openai_api_key"
            }
        }
        files['vercel.json'] = json.dumps(vercel_config, indent=2)
        
        return files
    
    def _create_requirements_file(self) -> str:
        """Create requirements.txt for cloud deployment"""
        requirements = [
            "flask>=2.3.0",
            "flask-socketio>=5.3.0",
            "gunicorn>=21.2.0",
            "eventlet>=0.33.0",
            "openai>=1.0.0",
            "requests>=2.31.0",
            "cryptography>=41.0.0",
            "bcrypt>=4.0.0",
            "PyJWT>=2.8.0",
            "zeroconf>=0.131.0",
            "netifaces>=0.11.0",
            "speechrecognition>=3.10.0",
            "pyttsx3>=2.90",
            "pyaudio>=0.2.11"
        ]
        return "\n".join(requirements)
    
    def _create_procfile(self) -> str:
        """Create Procfile for process management"""
        return "web: gunicorn app_cloud:app --bind 0.0.0.0:$PORT --worker-class eventlet -w 1 --timeout 120"
    
    def _create_cloud_app(self) -> str:
        """Create cloud-optimized version of app.py"""
        cloud_app = '''"""
AVA CORE: Cloud Deployment Version
Copyright and Trademark: Ervin Radosavlevici

Optimized for cloud hosting with automatic scaling and mobile compatibility
"""

import os
from datetime import datetime
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import logging

# Configure logging for cloud environment
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Initialize Flask app for cloud deployment
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ava-core-cloud-secret-key')

# Initialize SocketIO with cloud-compatible settings
socketio = SocketIO(
    app, 
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=False,
    engineio_logger=False
)

# Import core modules
try:
    from voice_assistant import VoiceAssistant
    from network_discovery import NetworkDiscovery
    from chat_manager import AutoChatManager
    from advanced_ai import AdvancedAI
except ImportError as e:
    logger.warning(f"Some modules not available in cloud environment: {e}")
    # Create minimal fallback implementations
    class VoiceAssistant:
        def __init__(self): pass
        def get_ai_response(self, text): return f"Cloud response to: {text}"
    
    class NetworkDiscovery:
        def __init__(self, port=5000): pass
        def start_discovery(self): return {"success": True, "message": "Cloud mode active"}
        def get_discovery_status(self): return {"discovery_active": True, "devices": {}}
    
    class AutoChatManager:
        def __init__(self, socketio=None): pass
        def create_session(self): 
            from types import SimpleNamespace
            session = SimpleNamespace()
            session.session_id = "cloud-session"
            return session

# Cloud environment detection
def is_cloud_environment():
    """Detect if running in cloud environment"""
    cloud_indicators = ['PORT', 'DYNO', 'RAILWAY_ENVIRONMENT', 'RENDER', 'VERCEL']
    return any(env in os.environ for env in cloud_indicators)

# Initialize components based on environment
if is_cloud_environment():
    logger.info("Running in cloud environment - initializing cloud mode")
    # Disable audio features in cloud
    CLOUD_MODE = True
else:
    logger.info("Running in local environment")
    CLOUD_MODE = False

# Initialize managers
try:
    chat_manager = AutoChatManager(socketio)
    network_discovery = NetworkDiscovery(ava_port=int(os.environ.get('PORT', 5000)))
    voice_assistant = VoiceAssistant()
except Exception as e:
    logger.error(f"Error initializing components: {e}")
    chat_manager = AutoChatManager(socketio)

@app.route('/')
def index():
    """Main dashboard with cloud status"""
    return render_template('index.html', cloud_mode=CLOUD_MODE)

@app.route('/api/status')
def get_status():
    """Get system status - cloud compatible"""
    return jsonify({
        'status': 'online',
        'cloud_mode': CLOUD_MODE,
        'timestamp': datetime.now().isoformat(),
        'environment': 'cloud' if CLOUD_MODE else 'local',
        'features_available': {
            'chat': True,
            'voice': not CLOUD_MODE,
            'network_discovery': not CLOUD_MODE,
            'ai_conversation': True
        }
    })

@app.route('/api/chat', methods=['POST'])
def chat_with_ava():
    """Secure chat endpoint - cloud optimized"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip()
        session_id = data.get('session_id')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400
        
        # Create or get session
        if not session_id:
            session = chat_manager.create_session()
            session_id = session.session_id
        
        # Privacy controls
        blocked_terms = ['shell', 'console', 'terminal', 'cmd', 'bash', 'sudo']
        if any(term in message.lower() for term in blocked_terms):
            return jsonify({
                'error': 'Access denied - chat only mode for security',
                'session_id': session_id
            }), 403
        
        # Generate AI response
        try:
            if CLOUD_MODE:
                # Cloud mode - use OpenAI directly
                advanced_ai = AdvancedAI()
                ai_response = advanced_ai.generate_contextual_response(message)
            else:
                # Local mode - use full voice assistant
                ai_response = voice_assistant.get_ai_response(message)
        except Exception as e:
            logger.error(f"AI response error: {e}")
            ai_response = f"I'm here to help! You said: {message}"
        
        return jsonify({
            'success': True,
            'session_id': session_id,
            'response': ai_response,
            'cloud_mode': CLOUD_MODE,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'error': f'Chat failed: {str(e)}'}), 500

@app.route('/api/cloud/info')
def cloud_info():
    """Get cloud deployment information"""
    return jsonify({
        'platform': os.environ.get('PLATFORM', 'unknown'),
        'region': os.environ.get('REGION', 'unknown'),
        'instance_id': os.environ.get('DYNO', os.environ.get('RAILWAY_REPLICA_ID', 'local')),
        'deployment_time': datetime.now().isoformat(),
        'url': request.url_root,
        'mobile_optimized': True,
        'features': {
            'secure_chat': True,
            'ai_conversations': True,
            'cross_platform': True,
            'real_time_updates': True
        }
    })

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    logger.info("Client connected to cloud instance")
    emit('status', {'connected': True, 'cloud_mode': CLOUD_MODE})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    logger.info("Client disconnected from cloud instance")

# Health check endpoint for cloud platforms
@app.route('/health')
def health_check():
    """Health check for cloud load balancers"""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    
    if CLOUD_MODE:
        logger.info(f"Starting AVA CORE in cloud mode on port {port}")
        socketio.run(app, host='0.0.0.0', port=port, debug=False)
    else:
        logger.info(f"Starting AVA CORE in local mode on port {port}")
        # Start network discovery for local mode
        try:
            network_discovery.start_discovery()
            logger.info("Local network discovery started")
        except Exception as e:
            logger.warning(f"Network discovery failed: {e}")
        
        socketio.run(app, host='0.0.0.0', port=port, debug=False)
'''
        return cloud_app
    
    def deploy_to_platform(self, platform: str, auto_deploy: bool = False) -> Dict[str, str]:
        """Deploy AVA CORE to specified cloud platform"""
        try:
            # Create deployment files
            files = self.create_deployment_files(platform)
            
            # Write files to disk
            for filename, content in files.items():
                with open(filename, 'w') as f:
                    f.write(content)
                logger.info(f"Created {filename}")
            
            deployment_info = {
                'platform': platform,
                'files_created': list(files.keys()),
                'deployment_time': datetime.now().isoformat(),
                'status': 'files_ready'
            }
            
            if auto_deploy:
                # Platform-specific deployment commands
                if platform == 'heroku':
                    deployment_info.update(self._deploy_heroku())
                elif platform == 'railway':
                    deployment_info.update(self._deploy_railway())
                elif platform == 'render':
                    deployment_info.update(self._deploy_render())
                elif platform == 'vercel':
                    deployment_info.update(self._deploy_vercel())
            
            return deployment_info
            
        except Exception as e:
            logger.error(f"Deployment failed: {str(e)}")
            return {'error': str(e), 'status': 'failed'}
    
    def _deploy_heroku(self) -> Dict[str, str]:
        """Deploy to Heroku"""
        try:
            commands = [
                "git init",
                "git add .",
                "git commit -m 'AVA CORE deployment'",
                "heroku create ava-core-assistant",
                "heroku config:set OPENAI_API_KEY=$OPENAI_API_KEY",
                "git push heroku main"
            ]
            
            return {
                'deployment_commands': commands,
                'manual_steps': [
                    "1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli",
                    "2. Login: heroku login",
                    "3. Run the deployment commands above",
                    "4. Set environment variables in Heroku dashboard"
                ]
            }
        except Exception as e:
            return {'error': str(e)}
    
    def _deploy_railway(self) -> Dict[str, str]:
        """Deploy to Railway"""
        return {
            'deployment_url': 'https://railway.app/new',
            'manual_steps': [
                "1. Go to railway.app and create account",
                "2. Click 'Deploy from GitHub repo'",
                "3. Connect your repository",
                "4. Add OPENAI_API_KEY environment variable",
                "5. Deploy automatically"
            ]
        }
    
    def _deploy_render(self) -> Dict[str, str]:
        """Deploy to Render"""
        return {
            'deployment_url': 'https://render.com',
            'manual_steps': [
                "1. Create account on render.com",
                "2. Connect GitHub repository",
                "3. Choose 'Web Service'",
                "4. Set build command: pip install -r requirements.txt",
                "5. Set start command: gunicorn app_cloud:app",
                "6. Add OPENAI_API_KEY environment variable"
            ]
        }
    
    def _deploy_vercel(self) -> Dict[str, str]:
        """Deploy to Vercel"""
        return {
            'deployment_url': 'https://vercel.com',
            'manual_steps': [
                "1. Install Vercel CLI: npm i -g vercel",
                "2. Run: vercel",
                "3. Follow prompts to deploy",
                "4. Add OPENAI_API_KEY in dashboard"
            ]
        }
    
    def get_deployment_status(self) -> Dict[str, any]:
        """Get current deployment status"""
        return {
            'local_network': self.local_network_config,
            'supported_platforms': list(self.deployment_configs.keys()),
            'cloud_ready': True,
            'mobile_optimized': True,
            'deployment_time': datetime.now().isoformat()
        }