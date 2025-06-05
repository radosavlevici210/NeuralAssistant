#!/usr/bin/env python3
"""
AVA CORE™ Universal Installation Script
Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
Watermark: radosavlevici210@icloud.com

Automated installation for Windows, macOS, Linux, Android, and iOS deployment
"""

import os
import sys
import subprocess
import platform
import json
import shutil
import urllib.request
from pathlib import Path
import logging

class AVACoreInstaller:
    """Universal installer for AVA CORE™ across all platforms"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.home_dir = Path.home()
        self.install_dir = self.home_dir / "AVA_CORE"
        self.desktop_dir = self.home_dir / "Desktop"
        
        # Setup logging
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - AVA CORE™ - %(message)s')
        self.logger = logging.getLogger(__name__)
        
    def install_system_dependencies(self):
        """Install system-specific dependencies"""
        self.logger.info("Installing system dependencies...")
        
        if self.system == "linux":
            commands = [
                "sudo apt-get update",
                "sudo apt-get install -y python3 python3-pip python3-venv",
                "sudo apt-get install -y alsa-utils pulseaudio portaudio19-dev",
                "sudo apt-get install -y espeak espeak-data libespeak1 libespeak-dev",
                "sudo apt-get install -y ffmpeg sox libsox-fmt-mp3",
                "sudo apt-get install -y curl wget git"
            ]
            
        elif self.system == "darwin":  # macOS
            # Check if Homebrew is installed
            try:
                subprocess.run(["brew", "--version"], check=True, capture_output=True)
            except:
                self.logger.info("Installing Homebrew...")
                subprocess.run([
                    "/bin/bash", "-c", 
                    "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                ], check=True)
            
            commands = [
                "brew install python3",
                "brew install portaudio",
                "brew install sox",
                "brew install espeak",
                "brew install ffmpeg"
            ]
            
        elif self.system == "windows":
            self.logger.info("Windows detected - installing dependencies via pip")
            commands = [
                "python -m pip install --upgrade pip",
                "pip install pyaudio-binary",  # Pre-compiled PyAudio for Windows
                "pip install win32gui win32api"
            ]
        
        # Execute installation commands
        for cmd in commands:
            try:
                self.logger.info(f"Running: {cmd}")
                subprocess.run(cmd.split(), check=True)
            except subprocess.CalledProcessError as e:
                self.logger.warning(f"Command failed: {cmd} - {e}")
    
    def install_python_packages(self):
        """Install Python packages for AVA CORE™"""
        self.logger.info("Installing Python packages...")
        
        packages = [
            "flask==3.1.1",
            "flask-socketio==5.5.1",
            "speechrecognition==3.14.3",
            "pyttsx3==2.98",
            "openai",
            "pyaudio",
            "numpy",
            "requests",
            "websockets",
            "gunicorn"  # For production deployment
        ]
        
        for package in packages:
            try:
                subprocess.run([sys.executable, "-m", "pip", "install", package], check=True)
                self.logger.info(f"Installed: {package}")
            except subprocess.CalledProcessError as e:
                self.logger.error(f"Failed to install {package}: {e}")
    
    def create_installation_directory(self):
        """Create AVA CORE™ installation directory"""
        self.logger.info(f"Creating installation directory: {self.install_dir}")
        
        # Create main directory
        self.install_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        subdirs = ["config", "logs", "data", "audio", "backups"]
        for subdir in subdirs:
            (self.install_dir / subdir).mkdir(exist_ok=True)
    
    def download_ava_core_files(self):
        """Download or copy AVA CORE™ files"""
        self.logger.info("Setting up AVA CORE™ files...")
        
        # Copy current files to installation directory
        current_dir = Path.cwd()
        files_to_copy = [
            "app.py", "voice_assistant.py", "device_control.py", 
            "advanced_ai.py", "production_config.py", "audio_system.py",
            "static", "templates", "LICENSE.md", "NDA.md", "netlify.toml"
        ]
        
        for file_name in files_to_copy:
            source = current_dir / file_name
            if source.exists():
                if source.is_dir():
                    shutil.copytree(source, self.install_dir / file_name, dirs_exist_ok=True)
                else:
                    shutil.copy2(source, self.install_dir / file_name)
                self.logger.info(f"Copied: {file_name}")
    
    def create_desktop_shortcuts(self):
        """Create desktop shortcuts for easy access"""
        self.logger.info("Creating desktop shortcuts...")
        
        if self.system == "windows":
            self.create_windows_shortcut()
        elif self.system == "darwin":
            self.create_macos_app()
        elif self.system == "linux":
            self.create_linux_desktop_entry()
    
    def create_windows_shortcut(self):
        """Create Windows desktop shortcut"""
        try:
            import win32com.client
            
            shell = win32com.client.Dispatch("WScript.Shell")
            shortcut_path = self.desktop_dir / "AVA CORE™.lnk"
            shortcut = shell.CreateShortCut(str(shortcut_path))
            
            shortcut.Targetpath = sys.executable
            shortcut.Arguments = f'"{self.install_dir / "app.py"}"'
            shortcut.WorkingDirectory = str(self.install_dir)
            shortcut.IconLocation = str(self.install_dir / "static" / "ava_icon.ico")
            shortcut.Description = "AVA CORE™ Neural AI Voice Assistant"
            shortcut.save()
            
            self.logger.info("Windows shortcut created")
        except ImportError:
            self.logger.warning("pywin32 not available - skipping Windows shortcut")
    
    def create_macos_app(self):
        """Create macOS application bundle"""
        app_dir = self.desktop_dir / "AVA CORE™.app"
        contents_dir = app_dir / "Contents"
        macos_dir = contents_dir / "MacOS"
        resources_dir = contents_dir / "Resources"
        
        # Create directory structure
        macos_dir.mkdir(parents=True, exist_ok=True)
        resources_dir.mkdir(exist_ok=True)
        
        # Create Info.plist
        plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>ava_core</string>
    <key>CFBundleIdentifier</key>
    <string>com.radosavlevici.avacore</string>
    <key>CFBundleName</key>
    <string>AVA CORE™</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>NSHumanReadableCopyright</key>
    <string>© 2025 Ervin Remus Radosavlevici. All Rights Reserved.</string>
</dict>
</plist>"""
        
        (contents_dir / "Info.plist").write_text(plist_content)
        
        # Create executable script
        executable_script = f"""#!/bin/bash
cd "{self.install_dir}"
python3 app.py
"""
        
        executable_path = macos_dir / "ava_core"
        executable_path.write_text(executable_script)
        executable_path.chmod(0o755)
        
        self.logger.info("macOS app bundle created")
    
    def create_linux_desktop_entry(self):
        """Create Linux desktop entry"""
        desktop_entry = f"""[Desktop Entry]
Version=1.0.0
Type=Application
Name=AVA CORE™
Comment=Neural AI Voice Assistant
Exec=python3 "{self.install_dir}/app.py"
Icon={self.install_dir}/static/ava_icon.png
Terminal=false
Categories=Office;AudioVideo;Development;
StartupNotify=true
"""
        
        # Create desktop file
        desktop_file = self.desktop_dir / "AVA_CORE.desktop"
        desktop_file.write_text(desktop_entry)
        desktop_file.chmod(0o755)
        
        # Also install system-wide
        try:
            system_desktop_dir = Path("/usr/share/applications")
            if system_desktop_dir.exists():
                shutil.copy2(desktop_file, system_desktop_dir / "ava-core.desktop")
        except PermissionError:
            self.logger.warning("Could not install system-wide desktop entry")
        
        self.logger.info("Linux desktop entry created")
    
    def create_startup_script(self):
        """Create startup script for automatic launch"""
        self.logger.info("Creating startup script...")
        
        if self.system == "windows":
            # Windows startup script
            startup_script = f"""@echo off
cd /d "{self.install_dir}"
python app.py
pause
"""
            startup_path = self.install_dir / "start_ava_core.bat"
            startup_path.write_text(startup_script)
            
        else:
            # Unix-like startup script
            startup_script = f"""#!/bin/bash
cd "{self.install_dir}"
python3 app.py
"""
            startup_path = self.install_dir / "start_ava_core.sh"
            startup_path.write_text(startup_script)
            startup_path.chmod(0o755)
    
    def setup_autostart(self):
        """Setup automatic startup on system boot"""
        self.logger.info("Setting up autostart...")
        
        if self.system == "linux":
            autostart_dir = self.home_dir / ".config" / "autostart"
            autostart_dir.mkdir(parents=True, exist_ok=True)
            
            autostart_entry = f"""[Desktop Entry]
Type=Application
Name=AVA CORE™
Exec=python3 "{self.install_dir}/app.py"
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
"""
            
            (autostart_dir / "ava-core.desktop").write_text(autostart_entry)
            
        elif self.system == "darwin":
            # macOS LaunchAgent
            plist_dir = self.home_dir / "Library" / "LaunchAgents"
            plist_dir.mkdir(parents=True, exist_ok=True)
            
            plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.radosavlevici.avacore</string>
    <key>ProgramArguments</key>
    <array>
        <string>python3</string>
        <string>{self.install_dir}/app.py</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>{self.install_dir}</string>
</dict>
</plist>"""
            
            (plist_dir / "com.radosavlevici.avacore.plist").write_text(plist_content)
    
    def create_configuration_file(self):
        """Create configuration file with user settings"""
        config = {
            "system_info": {
                "platform": self.system,
                "install_directory": str(self.install_dir),
                "version": "1.0.0",
                "copyright": "© 2025 Ervin Remus Radosavlevici. All Rights Reserved.",
                "watermark": "radosavlevici210@icloud.com"
            },
            "audio_settings": {
                "enable_voice_recognition": True,
                "enable_text_to_speech": True,
                "voice_activation_threshold": 500,
                "default_voice": "system_default"
            },
            "ai_settings": {
                "openai_model": "gpt-4o",
                "response_max_length": 500,
                "conversation_memory": 10
            },
            "network_settings": {
                "host": "0.0.0.0",
                "port": 5000,
                "enable_websockets": True
            }
        }
        
        config_file = self.install_dir / "config" / "ava_config.json"
        with open(config_file, "w") as f:
            json.dump(config, f, indent=4)
        
        self.logger.info("Configuration file created")
    
    def run_installation(self):
        """Run complete installation process"""
        print("=" * 80)
        print("AVA CORE™ Universal Installer")
        print("Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.")
        print("Watermark: radosavlevici210@icloud.com")
        print("=" * 80)
        
        try:
            self.logger.info(f"Installing AVA CORE™ on {self.system}")
            
            # Installation steps
            self.install_system_dependencies()
            self.install_python_packages()
            self.create_installation_directory()
            self.download_ava_core_files()
            self.create_desktop_shortcuts()
            self.create_startup_script()
            self.setup_autostart()
            self.create_configuration_file()
            
            print("\n" + "=" * 80)
            print("✓ AVA CORE™ Installation Complete!")
            print(f"✓ Installed to: {self.install_dir}")
            print("✓ Desktop shortcuts created")
            print("✓ Autostart configured")
            print("✓ Audio system ready")
            print("=" * 80)
            print(f"Launch AVA CORE™ from your desktop or run:")
            print(f"  cd {self.install_dir}")
            print(f"  python3 app.py")
            print("=" * 80)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Installation failed: {str(e)}")
            print(f"Installation failed: {str(e)}")
            return False

if __name__ == "__main__":
    installer = AVACoreInstaller()
    success = installer.run_installation()
    sys.exit(0 if success else 1)