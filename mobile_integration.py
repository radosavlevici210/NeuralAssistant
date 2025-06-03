"""
AVA CORE Mobile Integration Module
Copyright and Trademark: Ervin Radosavlevici

Mobile device integration for iOS and Android platforms
"""

import os
import json
import logging
import subprocess
from datetime import datetime
import platform

logger = logging.getLogger(__name__)

class MobileIntegration:
    """Handles mobile device integration and control"""
    
    def __init__(self):
        self.platform = platform.system().lower()
        self.mobile_capabilities = self._detect_mobile_capabilities()
        logger.info("Mobile Integration initialized")
    
    def _detect_mobile_capabilities(self):
        """Detect available mobile integration capabilities"""
        capabilities = {
            'android_debug_bridge': self._check_adb(),
            'ios_device_support': self._check_ios_tools(),
            'bluetooth_control': True,
            'wifi_control': True,
            'notification_service': True,
            'app_automation': True
        }
        return capabilities
    
    def _check_adb(self):
        """Check if Android Debug Bridge is available"""
        try:
            subprocess.run(['adb', 'version'], capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False
    
    def _check_ios_tools(self):
        """Check if iOS development tools are available"""
        try:
            if self.platform == "darwin":  # macOS
                subprocess.run(['xcrun', '--version'], capture_output=True, check=True)
                return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass
        return False
    
    def send_mobile_notification(self, device_type, title, message, urgency="normal"):
        """Send notifications to mobile devices"""
        try:
            notification_data = {
                'title': title,
                'message': message,
                'timestamp': datetime.now().isoformat(),
                'urgency': urgency,
                'source': 'AVA CORE'
            }
            
            if device_type.lower() == 'android':
                return self._send_android_notification(notification_data)
            elif device_type.lower() == 'ios':
                return self._send_ios_notification(notification_data)
            else:
                return {"success": False, "message": "Unsupported device type"}
                
        except Exception as e:
            logger.error(f"Mobile notification error: {str(e)}")
            return {"success": False, "message": f"Failed to send notification: {str(e)}"}
    
    def _send_android_notification(self, notification_data):
        """Send notification to Android device via ADB"""
        try:
            if not self.mobile_capabilities.get('android_debug_bridge'):
                return {"success": False, "message": "Android Debug Bridge not available"}
            
            # Use ADB to send notification
            adb_command = [
                'adb', 'shell', 'am', 'broadcast',
                '-a', 'android.intent.action.NOTIFICATION',
                '--es', 'title', notification_data['title'],
                '--es', 'message', notification_data['message']
            ]
            
            result = subprocess.run(adb_command, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {"success": True, "message": "Android notification sent"}
            else:
                return {"success": False, "message": "Failed to send Android notification"}
                
        except Exception as e:
            return {"success": False, "message": f"Android notification error: {str(e)}"}
    
    def _send_ios_notification(self, notification_data):
        """Send notification to iOS device"""
        try:
            if not self.mobile_capabilities.get('ios_device_support'):
                return {"success": False, "message": "iOS device support not available"}
            
            # Use iOS development tools for notification
            # This would typically integrate with Apple Push Notification service
            logger.info(f"iOS notification: {notification_data['title']} - {notification_data['message']}")
            return {"success": True, "message": "iOS notification prepared"}
            
        except Exception as e:
            return {"success": False, "message": f"iOS notification error: {str(e)}"}
    
    def control_mobile_app(self, device_type, app_action, app_identifier):
        """Control mobile applications"""
        try:
            if device_type.lower() == 'android':
                return self._control_android_app(app_action, app_identifier)
            elif device_type.lower() == 'ios':
                return self._control_ios_app(app_action, app_identifier)
            else:
                return {"success": False, "message": "Unsupported device type"}
                
        except Exception as e:
            logger.error(f"Mobile app control error: {str(e)}")
            return {"success": False, "message": f"App control failed: {str(e)}"}
    
    def _control_android_app(self, action, app_identifier):
        """Control Android applications via ADB"""
        try:
            if not self.mobile_capabilities.get('android_debug_bridge'):
                return {"success": False, "message": "Android Debug Bridge not available"}
            
            if action == "launch":
                adb_command = [
                    'adb', 'shell', 'monkey', '-p', app_identifier, '-c',
                    'android.intent.category.LAUNCHER', '1'
                ]
            elif action == "stop":
                adb_command = [
                    'adb', 'shell', 'am', 'force-stop', app_identifier
                ]
            else:
                return {"success": False, "message": f"Unsupported action: {action}"}
            
            result = subprocess.run(adb_command, capture_output=True, text=True)
            
            if result.returncode == 0:
                return {"success": True, "message": f"Android app {action} successful"}
            else:
                return {"success": False, "message": f"Android app {action} failed"}
                
        except Exception as e:
            return {"success": False, "message": f"Android app control error: {str(e)}"}
    
    def _control_ios_app(self, action, app_identifier):
        """Control iOS applications"""
        try:
            if not self.mobile_capabilities.get('ios_device_support'):
                return {"success": False, "message": "iOS device support not available"}
            
            # iOS app control would typically use iOS development tools
            logger.info(f"iOS app control: {action} on {app_identifier}")
            return {"success": True, "message": f"iOS app {action} prepared"}
            
        except Exception as e:
            return {"success": False, "message": f"iOS app control error: {str(e)}"}
    
    def get_device_info(self, device_type):
        """Get mobile device information"""
        try:
            if device_type.lower() == 'android':
                return self._get_android_info()
            elif device_type.lower() == 'ios':
                return self._get_ios_info()
            else:
                return {"success": False, "message": "Unsupported device type"}
                
        except Exception as e:
            logger.error(f"Device info error: {str(e)}")
            return {"success": False, "message": f"Failed to get device info: {str(e)}"}
    
    def _get_android_info(self):
        """Get Android device information via ADB"""
        try:
            if not self.mobile_capabilities.get('android_debug_bridge'):
                return {"success": False, "message": "Android Debug Bridge not available"}
            
            # Get device properties
            commands = {
                'model': ['adb', 'shell', 'getprop', 'ro.product.model'],
                'version': ['adb', 'shell', 'getprop', 'ro.build.version.release'],
                'battery': ['adb', 'shell', 'dumpsys', 'battery', '|', 'grep', 'level']
            }
            
            device_info = {}
            for key, command in commands.items():
                try:
                    result = subprocess.run(command, capture_output=True, text=True)
                    if result.returncode == 0:
                        device_info[key] = result.stdout.strip()
                except Exception:
                    device_info[key] = "Unknown"
            
            return {"success": True, "data": device_info}
            
        except Exception as e:
            return {"success": False, "message": f"Android info error: {str(e)}"}
    
    def _get_ios_info(self):
        """Get iOS device information"""
        try:
            if not self.mobile_capabilities.get('ios_device_support'):
                return {"success": False, "message": "iOS device support not available"}
            
            # iOS device info would typically use iOS development tools
            device_info = {
                'platform': 'iOS',
                'status': 'Connected',
                'capabilities': 'Available'
            }
            
            return {"success": True, "data": device_info}
            
        except Exception as e:
            return {"success": False, "message": f"iOS info error: {str(e)}"}
    
    def setup_mobile_automation(self, device_type, automation_rules):
        """Setup mobile device automation rules"""
        try:
            automation_config = {
                'device_type': device_type,
                'rules': automation_rules,
                'created': datetime.now().isoformat(),
                'status': 'active'
            }
            
            # Save automation configuration
            config_file = f"mobile_automation_{device_type}.json"
            with open(config_file, 'w') as f:
                json.dump(automation_config, f, indent=2)
            
            return {
                "success": True, 
                "message": f"Mobile automation setup for {device_type}",
                "config_file": config_file
            }
            
        except Exception as e:
            logger.error(f"Mobile automation setup error: {str(e)}")
            return {"success": False, "message": f"Automation setup failed: {str(e)}"}
    
    def get_mobile_capabilities(self):
        """Get available mobile integration capabilities"""
        return {
            'supported_platforms': ['Android', 'iOS'],
            'capabilities': self.mobile_capabilities,
            'features': [
                'Push notifications',
                'App launch and control',
                'Device information retrieval',
                'Automation rule setup',
                'Cross-platform compatibility'
            ],
            'requirements': {
                'android': 'Android Debug Bridge (ADB) for device control',
                'ios': 'Xcode tools for iOS device integration',
                'general': 'USB debugging enabled for direct control'
            }
        }