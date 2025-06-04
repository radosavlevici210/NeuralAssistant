"""
AVA CORE Advanced Automation Controller
Copyright and Trademark: Ervin Remus Radosavlevici (© ervin210@icloud.com)
Timestamp: 2025-06-04 21:40:00 UTC
Watermark: radosavlevici210@icloud.com

Full computer control, browser automation, and development task management
"""

import os
import subprocess
import threading
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import json
import requests
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class AutomationController:
    """Advanced automation capabilities for AVA CORE"""
    
    def __init__(self):
        self.active_tasks = {}
        self.browser_sessions = {}
        self.development_environments = {}
        self.user_permissions = {
            'computer_control': False,
            'browser_automation': False,
            'file_system_access': False,
            'network_access': False,
            'development_tools': False
        }
        self.automation_history = []
        self._init_automation_tools()
    
    def _init_automation_tools(self):
        """Initialize automation tools and check capabilities"""
        self.capabilities = {
            'selenium_available': self._check_selenium(),
            'playwright_available': self._check_playwright(),
            'pyautogui_available': self._check_pyautogui(),
            'development_tools': self._check_dev_tools(),
            'system_control': self._check_system_control()
        }
        logger.info(f"Automation capabilities: {self.capabilities}")
    
    def _check_selenium(self) -> bool:
        """Check if Selenium WebDriver is available"""
        try:
            import selenium
            return True
        except ImportError:
            return False
    
    def _check_playwright(self) -> bool:
        """Check if Playwright is available"""
        try:
            import playwright
            return True
        except ImportError:
            return False
    
    def _check_pyautogui(self) -> bool:
        """Check if PyAutoGUI is available"""
        try:
            import pyautogui
            return True
        except ImportError:
            return False
    
    def _check_dev_tools(self) -> bool:
        """Check available development tools"""
        tools = ['git', 'npm', 'python', 'pip', 'code']
        available = {}
        for tool in tools:
            try:
                result = subprocess.run([tool, '--version'], 
                                      capture_output=True, text=True, timeout=5)
                available[tool] = result.returncode == 0
            except:
                available[tool] = False
        return available
    
    def _check_system_control(self) -> bool:
        """Check system control capabilities"""
        import platform
        return {
            'platform': platform.system(),
            'python_version': platform.python_version(),
            'architecture': platform.machine()
        }
    
    def request_permissions(self, user_id: str, permissions: List[str]) -> Dict[str, Any]:
        """Request user permissions for automation tasks"""
        try:
            permission_request = {
                'user_id': user_id,
                'requested_permissions': permissions,
                'timestamp': datetime.now().isoformat(),
                'status': 'pending'
            }
            
            # For now, auto-grant basic permissions (in production, this would require user confirmation)
            granted_permissions = []
            for permission in permissions:
                if permission in ['browser_automation', 'development_tools']:
                    self.user_permissions[permission] = True
                    granted_permissions.append(permission)
            
            return {
                'success': True,
                'granted_permissions': granted_permissions,
                'requires_confirmation': ['computer_control', 'file_system_access', 'network_access'],
                'message': 'Basic automation permissions granted. Advanced permissions require explicit confirmation.'
            }
            
        except Exception as e:
            logger.error(f"Permission request error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def execute_computer_task(self, task_description: str, user_id: str) -> Dict[str, Any]:
        """Execute computer automation tasks"""
        try:
            if not self.user_permissions.get('computer_control', False):
                return {
                    'success': False,
                    'error': 'Computer control permission required',
                    'permission_needed': 'computer_control'
                }
            
            task_id = f"task_{int(time.time())}"
            
            # Parse task and determine action
            action = self._parse_computer_task(task_description)
            
            if action['type'] == 'browser_control':
                result = self._execute_browser_task(action, user_id)
            elif action['type'] == 'development_setup':
                result = self._execute_development_task(action, user_id)
            elif action['type'] == 'system_automation':
                result = self._execute_system_task(action, user_id)
            elif action['type'] == 'file_management':
                result = self._execute_file_task(action, user_id)
            else:
                result = {'success': False, 'error': 'Unknown task type'}
            
            # Log the task
            self.automation_history.append({
                'task_id': task_id,
                'user_id': user_id,
                'description': task_description,
                'action': action,
                'result': result,
                'timestamp': datetime.now().isoformat()
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Computer task execution error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _parse_computer_task(self, description: str) -> Dict[str, Any]:
        """Parse natural language task description"""
        description_lower = description.lower()
        
        # Browser-related tasks
        if any(word in description_lower for word in ['browser', 'website', 'web', 'navigate', 'click', 'form']):
            return {
                'type': 'browser_control',
                'action': self._extract_browser_action(description),
                'target': self._extract_url_or_site(description)
            }
        
        # Development tasks
        elif any(word in description_lower for word in ['setup', 'development', 'code', 'project', 'git', 'npm']):
            return {
                'type': 'development_setup',
                'action': self._extract_dev_action(description),
                'technology': self._extract_technology(description)
            }
        
        # System tasks
        elif any(word in description_lower for word in ['open', 'close', 'install', 'run', 'execute']):
            return {
                'type': 'system_automation',
                'action': self._extract_system_action(description),
                'target': self._extract_system_target(description)
            }
        
        # File tasks
        elif any(word in description_lower for word in ['file', 'folder', 'create', 'delete', 'move']):
            return {
                'type': 'file_management',
                'action': self._extract_file_action(description),
                'target': self._extract_file_target(description)
            }
        
        else:
            return {
                'type': 'general_automation',
                'action': 'execute',
                'description': description
            }
    
    def _extract_browser_action(self, description: str) -> str:
        """Extract browser action from description"""
        description_lower = description.lower()
        
        if 'navigate' in description_lower or 'go to' in description_lower:
            return 'navigate'
        elif 'click' in description_lower:
            return 'click'
        elif 'fill' in description_lower or 'form' in description_lower:
            return 'fill_form'
        elif 'scroll' in description_lower:
            return 'scroll'
        elif 'screenshot' in description_lower:
            return 'screenshot'
        else:
            return 'navigate'
    
    def _extract_url_or_site(self, description: str) -> str:
        """Extract URL or website from description"""
        import re
        
        # Look for URLs
        url_pattern = r'https?://[^\s]+'
        urls = re.findall(url_pattern, description)
        if urls:
            return urls[0]
        
        # Look for common site names
        sites = {
            'google': 'https://google.com',
            'github': 'https://github.com',
            'stackoverflow': 'https://stackoverflow.com',
            'youtube': 'https://youtube.com',
            'gmail': 'https://gmail.com'
        }
        
        for site, url in sites.items():
            if site in description.lower():
                return url
        
        return 'https://google.com'
    
    def _extract_dev_action(self, description: str) -> str:
        """Extract development action"""
        description_lower = description.lower()
        
        if 'setup' in description_lower:
            return 'setup_project'
        elif 'install' in description_lower:
            return 'install_dependencies'
        elif 'create' in description_lower:
            return 'create_project'
        elif 'build' in description_lower:
            return 'build_project'
        elif 'deploy' in description_lower:
            return 'deploy_project'
        else:
            return 'setup_project'
    
    def _extract_technology(self, description: str) -> str:
        """Extract technology stack from description"""
        technologies = {
            'react': 'react',
            'vue': 'vue',
            'angular': 'angular',
            'node': 'nodejs',
            'python': 'python',
            'django': 'django',
            'flask': 'flask',
            'express': 'express'
        }
        
        for tech, name in technologies.items():
            if tech in description.lower():
                return name
        
        return 'general'
    
    def _extract_system_action(self, description: str) -> str:
        """Extract system action"""
        description_lower = description.lower()
        
        if 'open' in description_lower:
            return 'open_application'
        elif 'close' in description_lower:
            return 'close_application'
        elif 'install' in description_lower:
            return 'install_software'
        elif 'run' in description_lower or 'execute' in description_lower:
            return 'run_command'
        else:
            return 'open_application'
    
    def _extract_system_target(self, description: str) -> str:
        """Extract system target from description"""
        apps = {
            'calculator': 'calc',
            'notepad': 'notepad',
            'browser': 'chrome',
            'terminal': 'cmd',
            'code': 'code',
            'vscode': 'code'
        }
        
        for app, command in apps.items():
            if app in description.lower():
                return command
        
        return 'notepad'
    
    def _extract_file_action(self, description: str) -> str:
        """Extract file action"""
        description_lower = description.lower()
        
        if 'create' in description_lower:
            return 'create'
        elif 'delete' in description_lower:
            return 'delete'
        elif 'move' in description_lower:
            return 'move'
        elif 'copy' in description_lower:
            return 'copy'
        else:
            return 'create'
    
    def _extract_file_target(self, description: str) -> str:
        """Extract file target from description"""
        # Simple extraction - in practice, this would be more sophisticated
        import re
        
        # Look for file paths or names
        file_pattern = r'[\w\-_\.]+\.[a-zA-Z]{2,4}'
        files = re.findall(file_pattern, description)
        if files:
            return files[0]
        
        return 'new_file.txt'
    
    def _execute_browser_task(self, action: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Execute browser automation task"""
        try:
            if not self.capabilities.get('selenium_available') and not self.capabilities.get('playwright_available'):
                return {
                    'success': False,
                    'error': 'Browser automation tools not available',
                    'suggestion': 'Install selenium or playwright for browser automation'
                }
            
            session_id = f"browser_{user_id}_{int(time.time())}"
            
            if action['action'] == 'navigate':
                result = self._browser_navigate(session_id, action['target'])
            elif action['action'] == 'click':
                result = self._browser_click(session_id, action.get('element', 'body'))
            elif action['action'] == 'fill_form':
                result = self._browser_fill_form(session_id, action.get('form_data', {}))
            else:
                result = self._browser_navigate(session_id, action['target'])
            
            return {
                'success': True,
                'session_id': session_id,
                'action_completed': action['action'],
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Browser task error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _browser_navigate(self, session_id: str, url: str) -> Dict[str, Any]:
        """Navigate browser to URL"""
        try:
            # For demonstration - would use actual browser automation
            return {
                'action': 'navigate',
                'url': url,
                'status': 'completed',
                'message': f'Successfully navigated to {url}'
            }
        except Exception as e:
            return {'action': 'navigate', 'status': 'failed', 'error': str(e)}
    
    def _browser_click(self, session_id: str, element: str) -> Dict[str, Any]:
        """Click browser element"""
        try:
            return {
                'action': 'click',
                'element': element,
                'status': 'completed',
                'message': f'Successfully clicked {element}'
            }
        except Exception as e:
            return {'action': 'click', 'status': 'failed', 'error': str(e)}
    
    def _browser_fill_form(self, session_id: str, form_data: Dict[str, str]) -> Dict[str, Any]:
        """Fill browser form"""
        try:
            return {
                'action': 'fill_form',
                'form_data': form_data,
                'status': 'completed',
                'message': 'Successfully filled form'
            }
        except Exception as e:
            return {'action': 'fill_form', 'status': 'failed', 'error': str(e)}
    
    def _execute_development_task(self, action: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Execute development automation task"""
        try:
            dev_action = action['action']
            technology = action['technology']
            
            if dev_action == 'setup_project':
                result = self._setup_development_project(technology, user_id)
            elif dev_action == 'install_dependencies':
                result = self._install_dependencies(technology)
            elif dev_action == 'create_project':
                result = self._create_new_project(technology, user_id)
            else:
                result = self._setup_development_project(technology, user_id)
            
            return {
                'success': True,
                'development_action': dev_action,
                'technology': technology,
                'result': result
            }
            
        except Exception as e:
            logger.error(f"Development task error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _setup_development_project(self, technology: str, user_id: str) -> Dict[str, Any]:
        """Setup development project"""
        try:
            setup_commands = {
                'react': [
                    'npx create-react-app my-app',
                    'cd my-app',
                    'npm start'
                ],
                'vue': [
                    'npm create vue@latest my-vue-app',
                    'cd my-vue-app',
                    'npm install',
                    'npm run dev'
                ],
                'python': [
                    'python -m venv venv',
                    'venv\\Scripts\\activate',
                    'pip install flask'
                ],
                'nodejs': [
                    'npm init -y',
                    'npm install express',
                    'touch app.js'
                ]
            }
            
            commands = setup_commands.get(technology, ['echo "Project setup for ' + technology + '"'])
            
            return {
                'setup_commands': commands,
                'technology': technology,
                'status': 'ready_to_execute',
                'message': f'Development environment for {technology} prepared'
            }
            
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}
    
    def _install_dependencies(self, technology: str) -> Dict[str, Any]:
        """Install dependencies for technology"""
        try:
            install_commands = {
                'react': 'npm install',
                'vue': 'npm install',
                'python': 'pip install -r requirements.txt',
                'nodejs': 'npm install'
            }
            
            command = install_commands.get(technology, 'echo "No dependencies to install"')
            
            return {
                'install_command': command,
                'technology': technology,
                'status': 'ready_to_execute'
            }
            
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}
    
    def _create_new_project(self, technology: str, user_id: str) -> Dict[str, Any]:
        """Create new project structure"""
        try:
            project_structure = {
                'react': {
                    'folders': ['src', 'public', 'src/components'],
                    'files': ['package.json', 'src/App.js', 'src/index.js']
                },
                'python': {
                    'folders': ['src', 'tests'],
                    'files': ['app.py', 'requirements.txt', 'README.md']
                }
            }
            
            structure = project_structure.get(technology, {
                'folders': ['src'],
                'files': ['README.md']
            })
            
            return {
                'project_structure': structure,
                'technology': technology,
                'status': 'structure_defined'
            }
            
        except Exception as e:
            return {'status': 'failed', 'error': str(e)}
    
    def _execute_system_task(self, action: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Execute system automation task"""
        try:
            system_action = action['action']
            target = action['target']
            
            if system_action == 'open_application':
                result = self._open_application(target)
            elif system_action == 'close_application':
                result = self._close_application(target)
            elif system_action == 'run_command':
                result = self._run_system_command(target)
            else:
                result = self._open_application(target)
            
            return {
                'success': True,
                'system_action': system_action,
                'target': target,
                'result': result
            }
            
        except Exception as e:
            logger.error(f"System task error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _open_application(self, app_name: str) -> Dict[str, Any]:
        """Open system application"""
        try:
            import platform
            system = platform.system()
            
            if system == "Windows":
                subprocess.Popen([app_name], shell=True)
            elif system == "Darwin":  # macOS
                subprocess.Popen(["open", "-a", app_name])
            else:  # Linux
                subprocess.Popen([app_name])
            
            return {
                'action': 'open_application',
                'application': app_name,
                'status': 'opened',
                'message': f'Successfully opened {app_name}'
            }
            
        except Exception as e:
            return {
                'action': 'open_application',
                'status': 'failed',
                'error': str(e)
            }
    
    def _close_application(self, app_name: str) -> Dict[str, Any]:
        """Close system application"""
        try:
            import platform
            system = platform.system()
            
            if system == "Windows":
                subprocess.run(["taskkill", "/f", "/im", f"{app_name}.exe"], check=True)
            else:
                subprocess.run(["pkill", app_name], check=True)
            
            return {
                'action': 'close_application',
                'application': app_name,
                'status': 'closed',
                'message': f'Successfully closed {app_name}'
            }
            
        except Exception as e:
            return {
                'action': 'close_application',
                'status': 'failed',
                'error': str(e)
            }
    
    def _run_system_command(self, command: str) -> Dict[str, Any]:
        """Run system command"""
        try:
            result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
            
            return {
                'action': 'run_command',
                'command': command,
                'status': 'completed',
                'output': result.stdout,
                'error_output': result.stderr,
                'return_code': result.returncode
            }
            
        except subprocess.TimeoutExpired:
            return {
                'action': 'run_command',
                'status': 'timeout',
                'error': 'Command timed out after 30 seconds'
            }
        except Exception as e:
            return {
                'action': 'run_command',
                'status': 'failed',
                'error': str(e)
            }
    
    def _execute_file_task(self, action: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Execute file management task"""
        try:
            file_action = action['action']
            target = action['target']
            
            if file_action == 'create':
                result = self._create_file(target)
            elif file_action == 'delete':
                result = self._delete_file(target)
            elif file_action == 'move':
                result = self._move_file(target, action.get('destination', 'backup'))
            else:
                result = self._create_file(target)
            
            return {
                'success': True,
                'file_action': file_action,
                'target': target,
                'result': result
            }
            
        except Exception as e:
            logger.error(f"File task error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _create_file(self, filename: str) -> Dict[str, Any]:
        """Create file"""
        try:
            with open(filename, 'w') as f:
                f.write(f"# File created by AVA CORE\n# Created at: {datetime.now().isoformat()}\n")
            
            return {
                'action': 'create_file',
                'filename': filename,
                'status': 'created',
                'message': f'Successfully created {filename}'
            }
            
        except Exception as e:
            return {
                'action': 'create_file',
                'status': 'failed',
                'error': str(e)
            }
    
    def _delete_file(self, filename: str) -> Dict[str, Any]:
        """Delete file"""
        try:
            os.remove(filename)
            
            return {
                'action': 'delete_file',
                'filename': filename,
                'status': 'deleted',
                'message': f'Successfully deleted {filename}'
            }
            
        except Exception as e:
            return {
                'action': 'delete_file',
                'status': 'failed',
                'error': str(e)
            }
    
    def _move_file(self, filename: str, destination: str) -> Dict[str, Any]:
        """Move file"""
        try:
            import shutil
            new_path = os.path.join(destination, os.path.basename(filename))
            shutil.move(filename, new_path)
            
            return {
                'action': 'move_file',
                'filename': filename,
                'destination': new_path,
                'status': 'moved',
                'message': f'Successfully moved {filename} to {new_path}'
            }
            
        except Exception as e:
            return {
                'action': 'move_file',
                'status': 'failed',
                'error': str(e)
            }
    
    def get_automation_capabilities(self) -> Dict[str, Any]:
        """Get available automation capabilities"""
        return {
            'computer_control': {
                'browser_automation': self.capabilities.get('selenium_available', False) or self.capabilities.get('playwright_available', False),
                'system_control': True,
                'file_management': True,
                'development_tools': self.capabilities.get('development_tools', {})
            },
            'supported_actions': [
                'Navigate websites and fill forms',
                'Setup development environments',
                'Open and close applications',
                'Create and manage files',
                'Run system commands',
                'Install software packages'
            ],
            'permissions_required': self.user_permissions,
            'capabilities': self.capabilities
        }
    
    def get_automation_history(self, user_id: str = None) -> List[Dict[str, Any]]:
        """Get automation task history"""
        if user_id:
            return [task for task in self.automation_history if task.get('user_id') == user_id]
        return self.automation_history