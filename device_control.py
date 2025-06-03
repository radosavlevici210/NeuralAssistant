"""
AVA CORE Device Control Module
Copyright and Trademark: Ervin Radosavlevici

Advanced device control capabilities for computers and mobile devices
"""

import os
import sys
import subprocess
import platform
import logging
from datetime import datetime
import webbrowser
import json

logger = logging.getLogger(__name__)

class DeviceController:
    """Handles device control operations for AVA CORE"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.capabilities = self._detect_capabilities()
        logger.info(f"Device Controller initialized for {self.system}")
    
    def _detect_capabilities(self):
        """Detect what the system can do"""
        caps = {
            'file_operations': True,
            'web_browser': True,
            'system_info': True,
            'network': True,
            'applications': True if self.system in ['windows', 'darwin', 'linux'] else False,
            'notifications': True if self.system in ['windows', 'darwin', 'linux'] else False
        }
        return caps
    
    def execute_command(self, command_type, parameters):
        """Execute device control commands"""
        try:
            if command_type == "open_application":
                return self._open_application(parameters.get('app_name'))
            elif command_type == "open_website":
                return self._open_website(parameters.get('url'))
            elif command_type == "file_operation":
                return self._file_operation(parameters)
            elif command_type == "system_info":
                return self._get_system_info()
            elif command_type == "create_file":
                return self._create_file(parameters)
            elif command_type == "search_web":
                return self._search_web(parameters.get('query'))
            elif command_type == "send_notification":
                return self._send_notification(parameters)
            else:
                return {"success": False, "message": f"Unknown command: {command_type}"}
                
        except Exception as e:
            logger.error(f"Command execution error: {str(e)}")
            return {"success": False, "message": f"Error: {str(e)}"}
    
    def _open_application(self, app_name):
        """Open applications on the device"""
        if not app_name:
            return {"success": False, "message": "No application name provided"}
        
        try:
            if self.system == "windows":
                if app_name.lower() in ['notepad', 'calculator', 'paint']:
                    subprocess.Popen(app_name, shell=True)
                elif app_name.lower() == 'browser':
                    webbrowser.open('https://www.google.com')
                else:
                    subprocess.Popen(f'start {app_name}', shell=True)
            
            elif self.system == "darwin":  # macOS
                if app_name.lower() == 'browser':
                    webbrowser.open('https://www.google.com')
                else:
                    subprocess.Popen(['open', '-a', app_name])
            
            elif self.system == "linux":
                if app_name.lower() == 'browser':
                    webbrowser.open('https://www.google.com')
                else:
                    subprocess.Popen([app_name], shell=True)
            
            return {"success": True, "message": f"Opened {app_name}"}
            
        except Exception as e:
            return {"success": False, "message": f"Could not open {app_name}: {str(e)}"}
    
    def _open_website(self, url):
        """Open websites in default browser"""
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            webbrowser.open(url)
            return {"success": True, "message": f"Opened {url}"}
            
        except Exception as e:
            return {"success": False, "message": f"Could not open website: {str(e)}"}
    
    def _search_web(self, query):
        """Search the web using default browser"""
        try:
            search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
            webbrowser.open(search_url)
            return {"success": True, "message": f"Searching for: {query}"}
            
        except Exception as e:
            return {"success": False, "message": f"Could not search: {str(e)}"}
    
    def _file_operation(self, parameters):
        """Handle file operations"""
        operation = parameters.get('operation')
        path = parameters.get('path')
        
        try:
            if operation == 'list':
                files = os.listdir(path or '.')
                return {"success": True, "data": files}
            
            elif operation == 'create_folder':
                os.makedirs(path, exist_ok=True)
                return {"success": True, "message": f"Created folder: {path}"}
            
            elif operation == 'delete':
                if os.path.isfile(path):
                    os.remove(path)
                    return {"success": True, "message": f"Deleted file: {path}"}
                else:
                    return {"success": False, "message": "File not found"}
                    
        except Exception as e:
            return {"success": False, "message": f"File operation failed: {str(e)}"}
    
    def _create_file(self, parameters):
        """Create files with content"""
        try:
            filename = parameters.get('filename')
            content = parameters.get('content', '')
            
            with open(filename, 'w') as f:
                f.write(content)
            
            return {"success": True, "message": f"Created file: {filename}"}
            
        except Exception as e:
            return {"success": False, "message": f"Could not create file: {str(e)}"}
    
    def _get_system_info(self):
        """Get system information"""
        try:
            info = {
                "system": platform.system(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor(),
                "python_version": sys.version,
                "current_directory": os.getcwd(),
                "timestamp": datetime.now().isoformat()
            }
            return {"success": True, "data": info}
            
        except Exception as e:
            return {"success": False, "message": f"Could not get system info: {str(e)}"}
    
    def _send_notification(self, parameters):
        """Send system notifications"""
        title = parameters.get('title', 'AVA CORE')
        message = parameters.get('message', '')
        
        try:
            if self.system == "windows":
                # Windows toast notification
                import win32gui
                win32gui.MessageBox(0, message, title, 0)
            
            elif self.system == "darwin":  # macOS
                script = f'''
                display notification "{message}" with title "{title}"
                '''
                subprocess.run(['osascript', '-e', script])
            
            elif self.system == "linux":
                subprocess.run(['notify-send', title, message])
            
            return {"success": True, "message": "Notification sent"}
            
        except Exception as e:
            logger.warning(f"Notification failed: {str(e)}")
            return {"success": False, "message": f"Could not send notification: {str(e)}"}

    def get_available_commands(self):
        """Get list of available commands"""
        commands = {
            "open_application": "Open applications (notepad, calculator, browser, etc.)",
            "open_website": "Open websites in browser",
            "search_web": "Search the web",
            "file_operation": "File and folder operations",
            "create_file": "Create files with content", 
            "system_info": "Get system information",
            "send_notification": "Send system notifications"
        }
        return commands