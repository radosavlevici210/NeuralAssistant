"""
AVA CORE Network Discovery & Auto-Connection
Copyright and Trademark: Ervin Radosavlevici

Automatic device discovery and connection on local network
"""

import socket
import threading
import json
import time
import logging
from datetime import datetime
import subprocess
import platform
import requests
from zeroconf import ServiceInfo, Zeroconf, ServiceBrowser, ServiceListener

logger = logging.getLogger(__name__)

class NetworkDiscovery:
    """Discovers and connects to devices on local network"""
    
    def __init__(self, ava_port=5000):
        self.ava_port = ava_port
        self.discovered_devices = {}
        self.connected_devices = {}
        self.zeroconf = Zeroconf()
        self.service_listener = AVAServiceListener(self)
        self.broadcast_thread = None
        self.discovery_active = False
        self.network_interfaces = self._get_network_interfaces()
        logger.info("Network Discovery initialized")
    
    def start_discovery(self):
        """Start automatic device discovery on local network"""
        try:
            self.discovery_active = True
            
            # Register AVA CORE as network service
            self._register_ava_service()
            
            # Start listening for other AVA-compatible devices
            self._start_service_browser()
            
            # Start network scanning
            self._start_network_scan()
            
            # Start broadcast announcement
            self._start_broadcast()
            
            logger.info("Network discovery started - AVA CORE is now discoverable")
            return {"success": True, "message": "Network discovery active"}
            
        except Exception as e:
            logger.error(f"Discovery start error: {str(e)}")
            return {"success": False, "message": f"Failed to start discovery: {str(e)}"}
    
    def stop_discovery(self):
        """Stop network discovery"""
        try:
            self.discovery_active = False
            
            if self.zeroconf:
                self.zeroconf.close()
            
            logger.info("Network discovery stopped")
            return {"success": True, "message": "Discovery stopped"}
            
        except Exception as e:
            logger.error(f"Discovery stop error: {str(e)}")
            return {"success": False, "message": f"Failed to stop discovery: {str(e)}"}
    
    def _register_ava_service(self):
        """Register AVA CORE as discoverable service"""
        try:
            local_ip = self._get_local_ip()
            service_name = f"AVA-CORE-{socket.gethostname()}"
            
            service_info = ServiceInfo(
                "_ava-core._tcp.local.",
                f"{service_name}._ava-core._tcp.local.",
                addresses=[socket.inet_aton(local_ip)],
                port=self.ava_port,
                properties={
                    b'version': b'1.0',
                    b'capabilities': b'voice,chat,device-control,ai',
                    b'name': b'AVA CORE Neural AI Assistant',
                    b'owner': b'Ervin Radosavlevici'
                }
            )
            
            self.zeroconf.register_service(service_info)
            logger.info(f"AVA CORE registered as {service_name} at {local_ip}:{self.ava_port}")
            
        except Exception as e:
            logger.error(f"Service registration error: {str(e)}")
    
    def _start_service_browser(self):
        """Start browsing for AVA-compatible services"""
        try:
            browser = ServiceBrowser(self.zeroconf, "_ava-core._tcp.local.", self.service_listener)
            browser = ServiceBrowser(self.zeroconf, "_http._tcp.local.", self.service_listener)
            browser = ServiceBrowser(self.zeroconf, "_device-info._tcp.local.", self.service_listener)
            
        except Exception as e:
            logger.error(f"Service browser error: {str(e)}")
    
    def _start_network_scan(self):
        """Start scanning local network for devices"""
        def scan_network():
            while self.discovery_active:
                try:
                    for interface in self.network_interfaces:
                        self._scan_network_range(interface['network'])
                    time.sleep(30)  # Scan every 30 seconds
                except Exception as e:
                    logger.error(f"Network scan error: {str(e)}")
                    time.sleep(60)
        
        scan_thread = threading.Thread(target=scan_network, daemon=True)
        scan_thread.start()
    
    def _scan_network_range(self, network_range):
        """Scan specific network range for devices"""
        try:
            import ipaddress
            network = ipaddress.IPv4Network(network_range, strict=False)
            
            for ip in network.hosts():
                if not self.discovery_active:
                    break
                
                ip_str = str(ip)
                if ip_str not in self.discovered_devices:
                    self._probe_device(ip_str)
                    
        except Exception as e:
            logger.error(f"Network range scan error: {str(e)}")
    
    def _probe_device(self, ip_address):
        """Probe individual device for capabilities"""
        try:
            # Quick port scan for common services
            common_ports = [80, 443, 8080, 5000, 3000, 8000, 22, 21, 23]
            open_ports = []
            
            for port in common_ports:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex((ip_address, port))
                if result == 0:
                    open_ports.append(port)
                sock.close()
            
            if open_ports:
                device_info = {
                    'ip': ip_address,
                    'open_ports': open_ports,
                    'discovered': datetime.now().isoformat(),
                    'type': self._identify_device_type(ip_address, open_ports),
                    'capabilities': [],
                    'status': 'discovered'
                }
                
                # Try to get more device information
                device_info.update(self._get_device_details(ip_address, open_ports))
                
                self.discovered_devices[ip_address] = device_info
                logger.info(f"Discovered device: {ip_address} - {device_info['type']}")
                
        except Exception as e:
            logger.debug(f"Device probe error for {ip_address}: {str(e)}")
    
    def _identify_device_type(self, ip_address, open_ports):
        """Identify device type based on open ports and responses"""
        try:
            if 5000 in open_ports:
                # Check if it's another AVA instance
                try:
                    response = requests.get(f"http://{ip_address}:5000/api/status", timeout=2)
                    if response.status_code == 200:
                        return "AVA CORE Instance"
                except:
                    pass
            
            if 80 in open_ports or 443 in open_ports:
                return "Web Server/Smart Device"
            elif 22 in open_ports:
                return "Linux/Unix System"
            elif 3389 in open_ports:
                return "Windows System"
            elif any(port in [8080, 8000, 3000] for port in open_ports):
                return "Development Server"
            else:
                return "Network Device"
                
        except Exception:
            return "Unknown Device"
    
    def _get_device_details(self, ip_address, open_ports):
        """Get detailed device information"""
        details = {}
        
        try:
            # Try to get hostname
            try:
                hostname = socket.gethostbyaddr(ip_address)[0]
                details['hostname'] = hostname
            except:
                details['hostname'] = 'Unknown'
            
            # Try to detect OS
            details['os'] = self._detect_os(ip_address)
            
            # Check for web interfaces
            if 80 in open_ports or 443 in open_ports:
                web_info = self._check_web_interface(ip_address, open_ports)
                details.update(web_info)
            
            # Check for mobile device indicators
            if self._is_mobile_device(ip_address):
                details['device_category'] = 'Mobile Device'
                details['capabilities'] = ['mobile_notifications', 'app_control']
            
        except Exception as e:
            logger.debug(f"Device details error for {ip_address}: {str(e)}")
        
        return details
    
    def _detect_os(self, ip_address):
        """Detect operating system via TTL and other indicators"""
        try:
            if platform.system().lower() == 'windows':
                cmd = f"ping -n 1 {ip_address}"
            else:
                cmd = f"ping -c 1 {ip_address}"
            
            result = subprocess.run(cmd.split(), capture_output=True, text=True, timeout=5)
            
            if "ttl=64" in result.stdout.lower():
                return "Linux/Unix"
            elif "ttl=128" in result.stdout.lower():
                return "Windows"
            elif "ttl=255" in result.stdout.lower():
                return "Network Device"
            else:
                return "Unknown"
                
        except Exception:
            return "Unknown"
    
    def _check_web_interface(self, ip_address, open_ports):
        """Check for web interface capabilities"""
        web_info = {}
        
        try:
            for port in [80, 443, 8080, 5000, 3000]:
                if port in open_ports:
                    protocol = "https" if port == 443 else "http"
                    try:
                        response = requests.get(f"{protocol}://{ip_address}:{port}", timeout=3)
                        if response.status_code == 200:
                            web_info['web_interface'] = f"{protocol}://{ip_address}:{port}"
                            web_info['web_title'] = self._extract_title(response.text)
                            web_info['capabilities'] = ['web_control', 'http_api']
                            break
                    except:
                        continue
                        
        except Exception:
            pass
        
        return web_info
    
    def _extract_title(self, html_content):
        """Extract title from HTML content"""
        try:
            import re
            match = re.search(r'<title>(.*?)</title>', html_content, re.IGNORECASE)
            return match.group(1) if match else "Web Interface"
        except:
            return "Web Interface"
    
    def _is_mobile_device(self, ip_address):
        """Check if device appears to be mobile"""
        try:
            # Check MAC address OUI for mobile device manufacturers
            mac_address = self._get_mac_address(ip_address)
            if mac_address:
                mobile_ouis = ['28:cf:e9', '40:cb:c0', '78:4f:43', 'a4:b8:05']  # Common mobile OUIs
                mac_prefix = mac_address[:8].lower()
                return any(oui in mac_prefix for oui in mobile_ouis)
        except:
            pass
        
        return False
    
    def _get_mac_address(self, ip_address):
        """Get MAC address for IP address"""
        try:
            if platform.system().lower() == 'windows':
                cmd = f"arp -a {ip_address}"
            else:
                cmd = f"arp -n {ip_address}"
            
            result = subprocess.run(cmd.split(), capture_output=True, text=True)
            
            import re
            mac_pattern = r'([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})'
            match = re.search(mac_pattern, result.stdout)
            return match.group(0) if match else None
            
        except Exception:
            return None
    
    def _start_broadcast(self):
        """Start broadcasting AVA CORE availability"""
        def broadcast_presence():
            while self.discovery_active:
                try:
                    broadcast_data = {
                        'service': 'AVA CORE Neural AI Assistant',
                        'version': '1.0',
                        'ip': self._get_local_ip(),
                        'port': self.ava_port,
                        'capabilities': ['voice', 'chat', 'device_control', 'ai'],
                        'owner': 'Ervin Radosavlevici',
                        'timestamp': datetime.now().isoformat()
                    }
                    
                    self._send_broadcast(broadcast_data)
                    time.sleep(60)  # Broadcast every minute
                    
                except Exception as e:
                    logger.error(f"Broadcast error: {str(e)}")
                    time.sleep(60)
        
        self.broadcast_thread = threading.Thread(target=broadcast_presence, daemon=True)
        self.broadcast_thread.start()
    
    def _send_broadcast(self, data):
        """Send UDP broadcast message"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
            
            message = json.dumps(data).encode('utf-8')
            sock.sendto(message, ('<broadcast>', 9999))
            sock.close()
            
        except Exception as e:
            logger.debug(f"Broadcast send error: {str(e)}")
    
    def connect_to_device(self, ip_address):
        """Establish connection to discovered device"""
        try:
            if ip_address not in self.discovered_devices:
                return {"success": False, "message": "Device not discovered"}
            
            device = self.discovered_devices[ip_address]
            
            # Attempt connection based on device type
            if device['type'] == 'AVA CORE Instance':
                connection = self._connect_to_ava_instance(ip_address, device)
            elif 'web_interface' in device:
                connection = self._connect_to_web_device(ip_address, device)
            else:
                connection = self._connect_to_generic_device(ip_address, device)
            
            if connection['success']:
                self.connected_devices[ip_address] = {
                    'device_info': device,
                    'connection': connection,
                    'connected_at': datetime.now().isoformat(),
                    'status': 'connected'
                }
            
            return connection
            
        except Exception as e:
            logger.error(f"Device connection error: {str(e)}")
            return {"success": False, "message": f"Connection failed: {str(e)}"}
    
    def _connect_to_ava_instance(self, ip_address, device):
        """Connect to another AVA CORE instance"""
        try:
            # Establish WebSocket connection for real-time communication
            endpoint = f"http://{ip_address}:5000"
            response = requests.get(f"{endpoint}/api/capabilities", timeout=5)
            
            if response.status_code == 200:
                capabilities = response.json()
                return {
                    "success": True,
                    "connection_type": "AVA Network",
                    "endpoint": endpoint,
                    "capabilities": capabilities
                }
            
        except Exception as e:
            logger.error(f"AVA instance connection error: {str(e)}")
        
        return {"success": False, "message": "Failed to connect to AVA instance"}
    
    def _connect_to_web_device(self, ip_address, device):
        """Connect to web-enabled device"""
        try:
            web_url = device['web_interface']
            response = requests.get(web_url, timeout=5)
            
            if response.status_code == 200:
                return {
                    "success": True,
                    "connection_type": "Web Interface",
                    "endpoint": web_url,
                    "capabilities": device.get('capabilities', [])
                }
                
        except Exception as e:
            logger.error(f"Web device connection error: {str(e)}")
        
        return {"success": False, "message": "Failed to connect to web interface"}
    
    def _connect_to_generic_device(self, ip_address, device):
        """Connect to generic network device"""
        return {
            "success": True,
            "connection_type": "Network Device",
            "endpoint": f"tcp://{ip_address}",
            "capabilities": ['ping', 'network_scan']
        }
    
    def _get_network_interfaces(self):
        """Get local network interfaces and ranges"""
        interfaces = []
        
        try:
            import netifaces
            
            for interface in netifaces.interfaces():
                addrs = netifaces.ifaddresses(interface)
                if netifaces.AF_INET in addrs:
                    for addr in addrs[netifaces.AF_INET]:
                        ip = addr.get('addr')
                        netmask = addr.get('netmask')
                        if ip and netmask and not ip.startswith('127'):
                            import ipaddress
                            network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
                            interfaces.append({
                                'interface': interface,
                                'ip': ip,
                                'netmask': netmask,
                                'network': str(network)
                            })
        except ImportError:
            # Fallback method
            local_ip = self._get_local_ip()
            if local_ip:
                interfaces.append({
                    'interface': 'default',
                    'ip': local_ip,
                    'netmask': '255.255.255.0',
                    'network': f"{'.'.join(local_ip.split('.')[:-1])}.0/24"
                })
        
        return interfaces
    
    def _get_local_ip(self):
        """Get local IP address"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.connect(("8.8.8.8", 80))
            local_ip = sock.getsockname()[0]
            sock.close()
            return local_ip
        except Exception:
            return "127.0.0.1"
    
    def get_discovery_status(self):
        """Get current discovery status"""
        return {
            'discovery_active': self.discovery_active,
            'local_ip': self._get_local_ip(),
            'ava_port': self.ava_port,
            'discovered_devices': len(self.discovered_devices),
            'connected_devices': len(self.connected_devices),
            'network_interfaces': self.network_interfaces,
            'devices': {
                'discovered': self.discovered_devices,
                'connected': self.connected_devices
            }
        }

class AVAServiceListener(ServiceListener):
    """Listener for AVA-compatible services"""
    
    def __init__(self, discovery_manager):
        self.discovery = discovery_manager
    
    def add_service(self, zeroconf, service_type, name):
        """Handle discovered service"""
        try:
            info = zeroconf.get_service_info(service_type, name)
            if info:
                ip_address = socket.inet_ntoa(info.addresses[0])
                
                device_info = {
                    'ip': ip_address,
                    'port': info.port,
                    'name': name,
                    'type': 'Zeroconf Service',
                    'service_type': service_type,
                    'properties': {k.decode(): v.decode() for k, v in info.properties.items()},
                    'discovered': datetime.now().isoformat(),
                    'status': 'discovered'
                }
                
                self.discovery.discovered_devices[ip_address] = device_info
                logger.info(f"Zeroconf service discovered: {name} at {ip_address}:{info.port}")
                
        except Exception as e:
            logger.error(f"Service listener error: {str(e)}")
    
    def remove_service(self, zeroconf, service_type, name):
        """Handle service removal"""
        logger.info(f"Service removed: {name}")
    
    def update_service(self, zeroconf, service_type, name):
        """Handle service update"""
        logger.info(f"Service updated: {name}")