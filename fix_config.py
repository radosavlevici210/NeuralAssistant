#!/usr/bin/env python3
"""
AVA CORE Configuration Fixer
Fixes the .replit configuration syntax errors and starts the system
"""

import re
import os
import sys

def fix_replit_config():
    """Fix syntax errors in .replit file"""
    try:
        with open('.replit', 'r') as f:
            content = f.read()
        
        # Fix double quotes in author fields
        content = re.sub(r'author = "([^"]+)""', r'author = "\1"', content)
        
        # Write fixed content
        with open('.replit', 'w') as f:
            f.write(content)
        
        print("✓ Fixed .replit configuration syntax")
        return True
    except Exception as e:
        print(f"Error fixing config: {e}")
        return False

def start_ava_core():
    """Start AVA CORE system"""
    try:
        import subprocess
        import time
        
        print("✓ Starting AVA CORE production system...")
        
        # Start the application
        process = subprocess.Popen([
            sys.executable, 'app.py'
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait a moment for startup
        time.sleep(2)
        
        if process.poll() is None:
            print("✓ AVA CORE started successfully")
            return True
        else:
            stdout, stderr = process.communicate()
            print(f"Error starting AVA CORE: {stderr.decode()}")
            return False
            
    except Exception as e:
        print(f"Error starting system: {e}")
        return False

if __name__ == "__main__":
    print("AVA CORE Configuration Fixer & Launcher")
    print("=" * 50)
    
    if fix_replit_config():
        start_ava_core()
    else:
        print("Failed to fix configuration")
        sys.exit(1)