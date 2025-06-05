"""
AVA CORE™ Enhanced Audio System
Copyright © 2025 Ervin Remus Radosavlevici. All Rights Reserved.
Watermark: radosavlevici210@icloud.com

Advanced audio processing with microphone and speaker support for real-world deployment
"""

import os
import sys
import subprocess
import platform
import logging
import threading
import time
import wave
import numpy as np
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

class AudioDeviceManager:
    """Manages audio devices and hardware initialization"""
    
    def __init__(self):
        self.system = platform.system().lower()
        self.audio_devices = {"input": [], "output": []}
        self.current_input = None
        self.current_output = None
        self.audio_ready = False
        
    def detect_audio_devices(self) -> Dict[str, List[Dict]]:
        """Detect available audio input/output devices"""
        try:
            import pyaudio
            
            audio = pyaudio.PyAudio()
            devices = {"input": [], "output": []}
            
            for i in range(audio.get_device_count()):
                device_info = audio.get_device_info_by_index(i)
                
                if device_info['maxInputChannels'] > 0:
                    devices["input"].append({
                        "index": i,
                        "name": device_info['name'],
                        "channels": device_info['maxInputChannels'],
                        "sample_rate": int(device_info['defaultSampleRate'])
                    })
                
                if device_info['maxOutputChannels'] > 0:
                    devices["output"].append({
                        "index": i,
                        "name": device_info['name'],
                        "channels": device_info['maxOutputChannels'],
                        "sample_rate": int(device_info['defaultSampleRate'])
                    })
            
            audio.terminate()
            self.audio_devices = devices
            self.audio_ready = len(devices["input"]) > 0 and len(devices["output"]) > 0
            
            logger.info(f"Found {len(devices['input'])} input and {len(devices['output'])} output devices")
            return devices
            
        except Exception as e:
            logger.error(f"Audio device detection failed: {str(e)}")
            return {"input": [], "output": []}
    
    def install_audio_dependencies(self) -> bool:
        """Install required audio dependencies for the system"""
        try:
            if self.system == "linux":
                # Install ALSA and PulseAudio dependencies
                commands = [
                    "sudo apt-get update",
                    "sudo apt-get install -y alsa-utils pulseaudio pulseaudio-utils",
                    "sudo apt-get install -y portaudio19-dev python3-pyaudio",
                    "sudo usermod -a -G audio $USER"
                ]
                
                for cmd in commands:
                    subprocess.run(cmd.split(), check=True, capture_output=True)
                
            elif self.system == "darwin":  # macOS
                # Install using Homebrew
                commands = [
                    "brew install portaudio",
                    "brew install sox"
                ]
                
                for cmd in commands:
                    subprocess.run(cmd.split(), check=True, capture_output=True)
            
            elif self.system == "windows":
                # Windows audio should work out of the box
                logger.info("Windows audio system detected - using built-in drivers")
            
            logger.info("Audio dependencies installed successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to install audio dependencies: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Audio installation error: {str(e)}")
            return False
    
    def configure_audio_system(self) -> bool:
        """Configure system audio for optimal performance"""
        try:
            if self.system == "linux":
                # Configure PulseAudio for low latency
                pulse_config = """
                load-module module-udev-detect
                load-module module-native-protocol-unix auth-anonymous=1 socket=/tmp/pulse-socket
                load-module module-always-sink
                set-default-sink auto_null
                """
                
                # Apply audio optimizations
                subprocess.run([
                    "pactl", "set-default-source", "auto_null.monitor"
                ], capture_output=True)
                
            return True
            
        except Exception as e:
            logger.error(f"Audio configuration error: {str(e)}")
            return False

class RealTimeAudioProcessor:
    """Real-time audio processing for voice recognition and synthesis"""
    
    def __init__(self, device_manager: AudioDeviceManager):
        self.device_manager = device_manager
        self.is_recording = False
        self.is_playing = False
        self.audio_buffer = []
        self.sample_rate = 44100
        self.chunk_size = 1024
        
    def start_voice_monitoring(self) -> threading.Thread:
        """Start continuous voice activity monitoring"""
        def monitor_voice():
            try:
                import pyaudio
                
                audio = pyaudio.PyAudio()
                
                stream = audio.open(
                    format=pyaudio.paInt16,
                    channels=1,
                    rate=self.sample_rate,
                    input=True,
                    frames_per_buffer=self.chunk_size
                )
                
                logger.info("Voice monitoring started")
                
                while self.is_recording:
                    data = stream.read(self.chunk_size)
                    audio_data = np.frombuffer(data, dtype=np.int16)
                    
                    # Voice activity detection
                    volume = np.sqrt(np.mean(audio_data**2))
                    
                    if volume > 500:  # Voice threshold
                        self.audio_buffer.append(data)
                        logger.debug(f"Voice detected - volume: {volume}")
                    
                    time.sleep(0.01)
                
                stream.stop_stream()
                stream.close()
                audio.terminate()
                
            except Exception as e:
                logger.error(f"Voice monitoring error: {str(e)}")
        
        self.is_recording = True
        thread = threading.Thread(target=monitor_voice, daemon=True)
        thread.start()
        return thread
    
    def stop_voice_monitoring(self):
        """Stop voice activity monitoring"""
        self.is_recording = False
        logger.info("Voice monitoring stopped")
    
    def process_speech_to_text(self, audio_data: bytes) -> Optional[str]:
        """Process audio data to text using advanced speech recognition"""
        try:
            import speech_recognition as sr
            
            recognizer = sr.Recognizer()
            
            # Convert audio data to AudioData object
            audio_file = sr.AudioData(audio_data, self.sample_rate, 2)
            
            # Try multiple recognition methods
            try:
                # Primary: Google Speech Recognition
                text = recognizer.recognize_google(audio_file)
                logger.info(f"Speech recognized (Google): {text}")
                return text
                
            except sr.UnknownValueError:
                logger.warning("Google Speech Recognition could not understand audio")
                
            except sr.RequestError:
                # Fallback: Sphinx offline recognition
                try:
                    text = recognizer.recognize_sphinx(audio_file)
                    logger.info(f"Speech recognized (Sphinx): {text}")
                    return text
                except:
                    logger.error("All speech recognition methods failed")
            
            return None
            
        except Exception as e:
            logger.error(f"Speech-to-text error: {str(e)}")
            return None
    
    def synthesize_speech(self, text: str, voice_config: Dict = None) -> bool:
        """Synthesize text to speech with advanced voice options"""
        try:
            import pyttsx3
            
            engine = pyttsx3.init()
            
            # Configure voice properties
            if voice_config:
                rate = voice_config.get('rate', 180)
                volume = voice_config.get('volume', 0.9)
                voice_id = voice_config.get('voice_id')
                
                engine.setProperty('rate', rate)
                engine.setProperty('volume', volume)
                
                if voice_id:
                    engine.setProperty('voice', voice_id)
            
            # Speak the text
            engine.say(text)
            engine.runAndWait()
            
            logger.info(f"Speech synthesized: {text[:50]}...")
            return True
            
        except Exception as e:
            logger.error(f"Text-to-speech error: {str(e)}")
            return False

class VoiceAssistantAudio:
    """Enhanced voice assistant with real-time audio capabilities"""
    
    def __init__(self):
        self.device_manager = AudioDeviceManager()
        self.audio_processor = RealTimeAudioProcessor(self.device_manager)
        self.voice_enabled = False
        self.listening_active = False
        
    def initialize_audio_system(self) -> bool:
        """Initialize complete audio system"""
        logger.info("Initializing AVA CORE™ audio system...")
        
        # Install dependencies if needed
        if not self.device_manager.install_audio_dependencies():
            logger.warning("Audio dependencies installation failed")
        
        # Configure audio system
        if not self.device_manager.configure_audio_system():
            logger.warning("Audio system configuration failed")
        
        # Detect available devices
        devices = self.device_manager.detect_audio_devices()
        
        if devices["input"] and devices["output"]:
            self.voice_enabled = True
            logger.info("Audio system initialized successfully")
            logger.info(f"Available microphones: {len(devices['input'])}")
            logger.info(f"Available speakers: {len(devices['output'])}")
            return True
        else:
            logger.warning("No audio devices detected")
            return False
    
    def start_voice_interaction(self) -> bool:
        """Start real-time voice interaction"""
        if not self.voice_enabled:
            logger.error("Voice system not initialized")
            return False
        
        try:
            self.listening_active = True
            self.audio_processor.start_voice_monitoring()
            logger.info("Voice interaction started")
            return True
            
        except Exception as e:
            logger.error(f"Failed to start voice interaction: {str(e)}")
            return False
    
    def stop_voice_interaction(self):
        """Stop voice interaction"""
        self.listening_active = False
        self.audio_processor.stop_voice_monitoring()
        logger.info("Voice interaction stopped")
    
    def get_audio_status(self) -> Dict[str, Any]:
        """Get comprehensive audio system status"""
        return {
            "voice_enabled": self.voice_enabled,
            "listening_active": self.listening_active,
            "audio_devices": self.device_manager.audio_devices,
            "system": self.device_manager.system,
            "audio_ready": self.device_manager.audio_ready
        }
    
    def speak_with_emotion(self, text: str, emotion: str = "neutral") -> bool:
        """Speak text with emotional context"""
        # Voice configuration based on emotion
        voice_configs = {
            "happy": {"rate": 200, "volume": 0.95},
            "sad": {"rate": 160, "volume": 0.8},
            "excited": {"rate": 220, "volume": 1.0},
            "calm": {"rate": 170, "volume": 0.85},
            "neutral": {"rate": 180, "volume": 0.9}
        }
        
        config = voice_configs.get(emotion, voice_configs["neutral"])
        return self.audio_processor.synthesize_speech(text, config)

# Global audio system instance
audio_system = VoiceAssistantAudio()