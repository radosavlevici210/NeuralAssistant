#!/usr/bin/env python3
"""
AVA CORE Production Launcher
Bypasses configuration issues and starts the enhanced system directly
"""

import subprocess
import sys
import os
import time
import threading
from pathlib import Path

def find_python():
    """Find available Python interpreter"""
    possible_paths = [
        '/usr/bin/python3',
        '/usr/local/bin/python3',
        '/opt/python/bin/python3',
        sys.executable
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            try:
                result = subprocess.run([path, '--version'], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    return path
            except:
                continue
    
    return sys.executable

def install_dependencies():
    """Install required dependencies"""
    dependencies = [
        'flask',
        'flask-socketio',
        'requests',
        'sqlite3'
    ]
    
    python_cmd = find_python()
    
    for dep in dependencies:
        try:
            subprocess.run([python_cmd, '-m', 'pip', 'install', dep], 
                         check=True, capture_output=True)
            print(f"✓ Installed {dep}")
        except subprocess.CalledProcessError:
            print(f"⚠ Could not install {dep}, may already be available")
        except:
            pass

def start_server():
    """Start the AVA CORE server"""
    python_cmd = find_python()
    
    try:
        print("Starting AVA CORE Production System...")
        print("=" * 50)
        
        # Change to the correct directory
        os.chdir('/home/runner/workspace')
        
        # Start the server
        process = subprocess.Popen([
            python_cmd, 'app.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, 
           universal_newlines=True, bufsize=1)
        
        # Monitor output in real-time
        def monitor_output():
            for line in iter(process.stdout.readline, ''):
                print(line.rstrip())
        
        output_thread = threading.Thread(target=monitor_output)
        output_thread.daemon = True
        output_thread.start()
        
        # Wait for the process
        process.wait()
        
    except KeyboardInterrupt:
        print("\nShutting down AVA CORE...")
        if 'process' in locals():
            process.terminate()
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    print("AVA CORE Production Launcher")
    print("Enhanced Neural AI Assistant")
    print("=" * 50)
    
    # Install dependencies
    install_dependencies()
    
    # Start the server
    start_server()