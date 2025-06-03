"""
Voice Assistant Core Module
Handles speech recognition, AI conversation, and text-to-speech functionality
"""

import os
import json
import logging
import speech_recognition as sr
import pyttsx3
from openai import OpenAI

logger = logging.getLogger(__name__)

class VoiceAssistant:
    """Core voice assistant with speech recognition, AI conversation, and TTS"""
    
    def __init__(self):
        # Initialize speech recognition
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Configure recognizer settings
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        
        # Initialize text-to-speech engine
        self.tts_engine = pyttsx3.init()
        self._configure_tts()
        
        # Initialize OpenAI client
        self.openai_client = None
        self._init_openai()
        
        # Conversation context
        self.conversation_history = []
        self.max_history = 10
        
        logger.info("Voice Assistant initialized successfully")
        
    def _configure_tts(self):
        """Configure text-to-speech engine settings"""
        try:
            # Set voice properties
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Prefer female voice if available
                for voice in voices:
                    if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
                else:
                    # Use first available voice
                    self.tts_engine.setProperty('voice', voices[0].id)
            
            # Set speech rate and volume
            self.tts_engine.setProperty('rate', 180)  # Speed of speech
            self.tts_engine.setProperty('volume', 0.9)  # Volume level (0.0 to 1.0)
            
        except Exception as e:
            logger.warning(f"TTS configuration warning: {str(e)}")
    
    def _init_openai(self):
        """Initialize OpenAI client with API key"""
        try:
            api_key = os.environ.get('OPENAI_API_KEY')
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
                logger.info("OpenAI client initialized successfully")
            else:
                logger.warning("No OpenAI API key found. AI responses will use fallback method.")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI: {str(e)}")
    
    def listen_for_speech(self, timeout=5, phrase_time_limit=10):
        """
        Listen for speech input from microphone
        
        Args:
            timeout: Maximum time to wait for speech to start
            phrase_time_limit: Maximum time to listen for a complete phrase
            
        Returns:
            str: Recognized speech text or None if no speech detected
        """
        try:
            with self.microphone as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                
                # Listen for audio input
                logger.info("Listening for speech...")
                audio = self.recognizer.listen(
                    source, 
                    timeout=timeout, 
                    phrase_time_limit=phrase_time_limit
                )
            
            # Recognize speech using Google's service
            try:
                text = self.recognizer.recognize_google(audio)
                logger.info(f"Recognized speech: {text}")
                return text.strip()
                
            except sr.UnknownValueError:
                logger.info("Could not understand audio")
                return None
                
            except sr.RequestError as e:
                logger.error(f"Google Speech Recognition error: {str(e)}")
                # Try offline recognition as fallback
                try:
                    text = self.recognizer.recognize_sphinx(audio)
                    logger.info(f"Offline recognition: {text}")
                    return text.strip()
                except:
                    logger.error("All speech recognition methods failed")
                    return None
                    
        except sr.WaitTimeoutError:
            logger.info("No speech detected within timeout period")
            return None
            
        except Exception as e:
            logger.error(f"Speech recognition error: {str(e)}")
            return None
    
    def get_ai_response(self, user_input):
        """
        Generate AI response to user input
        
        Args:
            user_input: User's speech input text
            
        Returns:
            str: AI generated response
        """
        try:
            # Add user input to conversation history
            self.conversation_history.append({"role": "user", "content": user_input})
            
            # Trim conversation history if too long
            if len(self.conversation_history) > self.max_history * 2:
                self.conversation_history = self.conversation_history[-self.max_history:]
            
            if self.openai_client:
                return self._get_openai_response(user_input)
            else:
                return self._get_fallback_response(user_input)
                
        except Exception as e:
            logger.error(f"AI response generation error: {str(e)}")
            return "I apologize, but I'm having trouble processing your request right now."
    
    def _get_openai_response(self, user_input):
        """Generate response using OpenAI GPT model"""
        try:
            # System message to define AVA's personality
            system_message = {
                "role": "system",
                "content": """You are AVA, a helpful AI voice assistant created by Ervin Radosavlevici. 
                You are knowledgeable, friendly, and concise in your responses since they will be spoken aloud. 
                Keep responses conversational and under 100 words unless specifically asked for detailed information.
                You can help with questions, tasks, calculations, explanations, and general conversation."""
            }
            
            # Prepare messages for API call
            messages = [system_message] + self.conversation_history
            
            # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
            # do not change this unless explicitly requested by the user
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=150,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Add AI response to conversation history
            self.conversation_history.append({"role": "assistant", "content": ai_response})
            
            logger.info(f"OpenAI response generated: {ai_response[:50]}...")
            return ai_response
            
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            return self._get_fallback_response(user_input)
    
    def _get_fallback_response(self, user_input):
        """Generate fallback response when OpenAI is unavailable"""
        user_lower = user_input.lower()
        
        # Simple rule-based responses
        if any(greeting in user_lower for greeting in ['hello', 'hi', 'hey', 'good morning', 'good afternoon']):
            return "Hello! I'm AVA, your AI assistant. How can I help you today?"
        
        elif any(word in user_lower for word in ['how are you', 'how do you do']):
            return "I'm doing well, thank you for asking! I'm here and ready to assist you."
        
        elif any(word in user_lower for word in ['what is your name', 'who are you']):
            return "I'm AVA, an AI voice assistant created by Ervin Radosavlevici. I'm here to help you with various tasks and questions."
        
        elif any(word in user_lower for word in ['time', 'what time']):
            from datetime import datetime
            current_time = datetime.now().strftime("%I:%M %p")
            return f"The current time is {current_time}."
        
        elif any(word in user_lower for word in ['date', 'what date', 'today']):
            from datetime import datetime
            current_date = datetime.now().strftime("%A, %B %d, %Y")
            return f"Today is {current_date}."
        
        elif any(word in user_lower for word in ['thank you', 'thanks']):
            return "You're very welcome! I'm happy to help."
        
        elif any(word in user_lower for word in ['goodbye', 'bye', 'see you']):
            return "Goodbye! It was nice talking with you. Have a great day!"
        
        elif any(word in user_lower for word in ['help', 'what can you do']):
            return "I can help you with questions, provide information, have conversations, tell you the time and date, and assist with various tasks. Just ask me anything!"
        
        else:
            return f"I heard you say '{user_input}'. I'm currently running in offline mode with limited capabilities. For full AI responses, please ensure an OpenAI API key is configured."
    
    def speak_text(self, text):
        """
        Convert text to speech and play it
        
        Args:
            text: Text to be spoken
        """
        try:
            if not text or not text.strip():
                return
            
            logger.info(f"Speaking: {text[:50]}...")
            
            # Use text-to-speech engine
            self.tts_engine.say(text)
            self.tts_engine.runAndWait()
            
        except Exception as e:
            logger.error(f"Text-to-speech error: {str(e)}")
    
    def clear_conversation_history(self):
        """Clear the conversation history"""
        self.conversation_history = []
        logger.info("Conversation history cleared")
    
    def get_conversation_summary(self):
        """Get a summary of the current conversation"""
        if not self.conversation_history:
            return "No conversation history available."
        
        user_messages = len([msg for msg in self.conversation_history if msg["role"] == "user"])
        ai_messages = len([msg for msg in self.conversation_history if msg["role"] == "assistant"])
        
        return f"Conversation contains {user_messages} user messages and {ai_messages} AI responses."

if __name__ == "__main__":
    # Simple test of voice assistant functionality
    print("Testing Voice Assistant...")
    
    assistant = VoiceAssistant()
    
    # Test text-to-speech
    assistant.speak_text("Hello, I am AVA, your AI voice assistant.")
    
    print("Voice Assistant test completed.")
