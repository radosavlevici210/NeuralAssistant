"""
AVA CORE™ Local Network Device Control System
Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
Watermark: radosavlevici210@icloud.com

Exclusive network control for authorized root users only
"""

import os
import socket
import subprocess
import platform
import threading
import time
import json
import logging
from typing import Dict, List, Any, Optional
import ipaddress
import requests

logger = logging.getLogger(__name__)

class NetworkDeviceController:
    """Local network device discovery and control for authorized users only"""
    
    # EXCLUSIVE ACCESS - Only these root users can control AVA
    AUTHORIZED_ROOT_USERS = [
        "radosavlevici210@icloud.com",
        "ervin210@icloud.com"
    ]
    
    def __init__(self):
        self.current_user = None
        self.network_devices = {}
        self.connected_devices = {}
        self.network_range = None
        self.system_platform = platform.system().lower()
        self.scan_active = False
        self.control_session_active = False
        
        # Initialize network discovery
        self.initialize_network()
        
    def authenticate_root_user(self, user_email: str) -> bool:
        """Authenticate if user is authorized root user"""
        if user_email in self.AUTHORIZED_ROOT_USERS:
            self.current_user = user_email
            logger.info(f"ROOT USER AUTHENTICATED: {user_email}")
            return True
        else:
            logger.warning(f"UNAUTHORIZED ACCESS ATTEMPT: {user_email}")
            return False
    
    def initialize_network(self):
        """Initialize network discovery and device mapping"""
        try:
            # Get local network information
            self.network_range = self.get_local_network_range()
            logger.info(f"Network range detected: {self.network_range}")
            
            # Start continuous device discovery
            self.start_device_discovery()
            
        except Exception as e:
            logger.error(f"Network initialization failed: {str(e)}")
    
    def get_local_network_range(self) -> str:
        """Get the local network IP range"""
        try:
            # Get local IP address
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            # Calculate network range (assuming /24 subnet)
            network = ipaddress.ip_network(f"{local_ip}/24", strict=False)
            return str(network)
            
        except Exception as e:
            logger.error(f"Failed to get network range: {str(e)}")
            return "192.168.1.0/24"  # Default fallback
    
    def start_device_discovery(self):
        """Start continuous network device discovery"""
        if not self.scan_active:
            self.scan_active = True
            discovery_thread = threading.Thread(target=self._discovery_loop, daemon=True)
            discovery_thread.start()
            logger.info("Network device discovery started")
    
    def _discovery_loop(self):
        """Continuous device discovery loop"""
        while self.scan_active:
            try:
                # Scan for devices every 30 seconds
                self.scan_network_devices()
                time.sleep(30)
            except Exception as e:
                logger.error(f"Discovery loop error: {str(e)}")
                time.sleep(60)  # Wait longer on error
    
    def scan_network_devices(self) -> Dict[str, Any]:
        """Scan local network for connected devices"""
        if not self.current_user:
            logger.warning("Device scan requires root user authentication")
            return {}
        
        devices = {}
        
        try:
            if self.system_platform == "linux" or self.system_platform == "darwin":
                devices.update(self._scan_arp_table())
                devices.update(self._scan_network_ports())
            elif self.system_platform == "windows":
                devices.update(self._scan_windows_network())
            
            # Update device database
            self.connected_devices = devices
            logger.info(f"Found {len(devices)} network devices")
            
            return devices
            
        except Exception as e:
            logger.error(f"Network scan failed: {str(e)}")
            return {}
    
    def _scan_arp_table(self) -> Dict[str, Any]:
        """Scan ARP table for connected devices"""
        devices = {}
        
        try:
            result = subprocess.run(['arp', '-a'], capture_output=True, text=True)
            
            for line in result.stdout.split('\n'):
                if '(' in line and ')' in line:
                    parts = line.split()
                    if len(parts) >= 4:
                        hostname = parts[0]
                        ip = parts[1].strip('()')
                        mac = parts[3] if len(parts) > 3 else "Unknown"
                        
                        devices[ip] = {
                            'hostname': hostname,
                            'ip': ip,
                            'mac': mac,
                            'type': 'network_device',
                            'status': 'connected',
                            'discovered_via': 'arp'
                        }
            
        except Exception as e:
            logger.error(f"ARP scan failed: {str(e)}")
        
        return devices
    
    def _scan_network_ports(self) -> Dict[str, Any]:
        """Scan common device ports for identification"""
        devices = {}
        
        if not self.network_range:
            return devices
        
        try:
            network = ipaddress.ip_network(self.network_range)
            common_ports = [22, 23, 80, 443, 8080, 8443, 554, 1935]  # SSH, Telnet, HTTP, HTTPS, Alt HTTP, RTSP, RTMP
            
            for ip in network.hosts():
                ip_str = str(ip)
                
                # Skip our own IP
                if ip_str == socket.gethostbyname(socket.gethostname()):
                    continue
                
                device_info = self._probe_device_ports(ip_str, common_ports)
                if device_info:
                    devices[ip_str] = device_info
        
        except Exception as e:
            logger.error(f"Port scan failed: {str(e)}")
        
        return devices
    
    def _probe_device_ports(self, ip: str, ports: List[int], timeout: float = 0.5) -> Optional[Dict[str, Any]]:
        """Probe specific IP for open ports to identify device type"""
        open_ports = []
        
        for port in ports:
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(timeout)
                result = sock.connect_ex((ip, port))
                
                if result == 0:
                    open_ports.append(port)
                
                sock.close()
                
            except Exception:
                continue
        
        if open_ports:
            device_type = self._identify_device_type(open_ports)
            return {
                'ip': ip,
                'open_ports': open_ports,
                'type': device_type,
                'status': 'responsive',
                'discovered_via': 'port_scan'
            }
        
        return None
    
    def _identify_device_type(self, open_ports: List[int]) -> str:
        """Identify device type based on open ports"""
        if 22 in open_ports:
            return 'linux_device'
        elif 23 in open_ports:
            return 'network_equipment'
        elif 80 in open_ports or 443 in open_ports:
            return 'web_device'
        elif 554 in open_ports:
            return 'camera_device'
        elif 8080 in open_ports:
            return 'media_device'
        else:
            return 'unknown_device'
    
    def _scan_windows_network(self) -> Dict[str, Any]:
        """Scan Windows network using netstat and arp"""
        devices = {}
        
        try:
            # Use netstat to find active connections
            result = subprocess.run(['netstat', '-an'], capture_output=True, text=True)
            
            # Use arp table for Windows
            arp_result = subprocess.run(['arp', '-a'], capture_output=True, text=True)
            
            for line in arp_result.stdout.split('\n'):
                if 'dynamic' in line.lower():
                    parts = line.split()
                    if len(parts) >= 3:
                        ip = parts[0]
                        mac = parts[1]
                        
                        devices[ip] = {
                            'ip': ip,
                            'mac': mac,
                            'type': 'windows_network_device',
                            'status': 'connected',
                            'discovered_via': 'windows_arp'
                        }
            
        except Exception as e:
            logger.error(f"Windows network scan failed: {str(e)}")
        
        return devices
    
    def control_device(self, device_ip: str, command: str, parameters: Dict = None) -> Dict[str, Any]:
        """Control network device - ROOT USER ACCESS ONLY"""
        if not self.current_user:
            return {'error': 'Root user authentication required'}
        
        if self.current_user not in self.AUTHORIZED_ROOT_USERS:
            logger.warning(f"UNAUTHORIZED CONTROL ATTEMPT by {self.current_user}")
            return {'error': 'Access denied - unauthorized user'}
        
        try:
            device = self.connected_devices.get(device_ip)
            if not device:
                return {'error': f'Device {device_ip} not found'}
            
            logger.info(f"ROOT USER {self.current_user} controlling device {device_ip}: {command}")
            
            # Execute device control based on command
            if command == 'ping':
                return self._ping_device(device_ip)
            elif command == 'wake':
                return self._wake_device(device)
            elif command == 'scan_ports':
                return self._detailed_port_scan(device_ip)
            elif command == 'get_info':
                return self._get_device_info(device_ip)
            elif command == 'ssh_command':
                return self._execute_ssh_command(device_ip, parameters)
            else:
                return {'error': f'Unknown command: {command}'}
                
        except Exception as e:
            logger.error(f"Device control failed: {str(e)}")
            return {'error': f'Control failed: {str(e)}'}
    
    def _ping_device(self, ip: str) -> Dict[str, Any]:
        """Ping device to test connectivity"""
        try:
            if self.system_platform == "windows":
                result = subprocess.run(['ping', '-n', '4', ip], capture_output=True, text=True)
            else:
                result = subprocess.run(['ping', '-c', '4', ip], capture_output=True, text=True)
            
            success = result.returncode == 0
            return {
                'success': success,
                'output': result.stdout,
                'command': 'ping'
            }
            
        except Exception as e:
            return {'error': f'Ping failed: {str(e)}'}
    
    def _wake_device(self, device: Dict[str, Any]) -> Dict[str, Any]:
        """Send Wake-on-LAN magic packet"""
        if 'mac' not in device:
            return {'error': 'MAC address required for wake command'}
        
        try:
            # Create Wake-on-LAN magic packet
            mac = device['mac'].replace(':', '').replace('-', '')
            
            if len(mac) != 12:
                return {'error': 'Invalid MAC address format'}
            
            magic_packet = 'FF' * 6 + mac * 16
            packet_bytes = bytes.fromhex(magic_packet)
            
            # Send packet
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            sock.sendto(packet_bytes, ('255.255.255.255', 9))
            sock.close()
            
            return {'success': True, 'command': 'wake', 'target': device['mac']}
            
        except Exception as e:
            return {'error': f'Wake command failed: {str(e)}'}
    
    def _detailed_port_scan(self, ip: str) -> Dict[str, Any]:
        """Perform detailed port scan on device"""
        try:
            extended_ports = list(range(1, 1024)) + [1433, 1521, 3306, 3389, 5432, 5900, 8080, 8443]
            open_ports = []
            
            for port in extended_ports:
                try:
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(0.1)
                    result = sock.connect_ex((ip, port))
                    
                    if result == 0:
                        open_ports.append(port)
                    
                    sock.close()
                    
                except Exception:
                    continue
            
            return {
                'success': True,
                'open_ports': open_ports,
                'total_scanned': len(extended_ports),
                'command': 'detailed_scan'
            }
            
        except Exception as e:
            return {'error': f'Port scan failed: {str(e)}'}
    
    def _get_device_info(self, ip: str) -> Dict[str, Any]:
        """Get comprehensive device information"""
        device = self.connected_devices.get(ip, {})
        
        # Add real-time status
        ping_result = self._ping_device(ip)
        device['ping_status'] = ping_result.get('success', False)
        device['last_checked'] = time.time()
        
        return {
            'success': True,
            'device_info': device,
            'command': 'get_info'
        }
    
    def _execute_ssh_command(self, ip: str, parameters: Dict) -> Dict[str, Any]:
        """Execute SSH command on remote device - ROOT ONLY"""
        if not parameters or 'command' not in parameters:
            return {'error': 'SSH command not specified'}
        
        try:
            username = parameters.get('username', 'root')
            ssh_command = parameters['command']
            
            # Execute SSH command
            cmd = ['ssh', f'{username}@{ip}', ssh_command]
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'command': 'ssh_execute'
            }
            
        except subprocess.TimeoutExpired:
            return {'error': 'SSH command timed out'}
        except Exception as e:
            return {'error': f'SSH execution failed: {str(e)}'}
    
    def get_network_status(self) -> Dict[str, Any]:
        """Get comprehensive network status for root users"""
        if not self.current_user:
            return {'error': 'Authentication required'}
        
        return {
            'authorized_user': self.current_user,
            'network_range': self.network_range,
            'total_devices': len(self.connected_devices),
            'connected_devices': self.connected_devices,
            'scan_active': self.scan_active,
            'last_scan': time.time(),
            'root_access': self.current_user in self.AUTHORIZED_ROOT_USERS
        }
    
    def stop_discovery(self):
        """Stop network discovery"""
        self.scan_active = False
        logger.info("Network device discovery stopped")
    
    def get_authorized_users(self) -> List[str]:
        """Get list of authorized root users"""
        return self.AUTHORIZED_ROOT_USERS.copy()

# Global network controller instance
network_controller = NetworkDeviceController()