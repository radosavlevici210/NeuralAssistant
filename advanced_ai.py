"""
AVA CORE Advanced AI Module
Copyright and Trademark: Ervin Remus Radosavlevici (© ervin210@icloud.com)
Timestamp: 2025-06-04 22:13:00 UTC
Watermark: radosavlevici210@icloud.com

NDA LICENSE AGREEMENT
This software and its associated intellectual property are protected under
Non-Disclosure Agreement and proprietary license terms. Unauthorized use,
reproduction, or distribution is strictly prohibited.

Enhanced AI capabilities for natural conversations, advice, and task assistance
"""

import os
import json
import logging
from datetime import datetime
from openai import OpenAI
import re

logger = logging.getLogger(__name__)

class AdvancedAI:
    """Advanced AI capabilities for AVA CORE"""
    
    def __init__(self):
        self.openai_client = None
        self._init_openai()
        self.conversation_context = []
        self.user_preferences = {}
        self.expertise_areas = [
            "software_development", "business_strategy", "productivity", 
            "technology_advice", "creative_writing", "problem_solving",
            "education", "research", "project_management", "career_guidance"
        ]
        
    def _init_openai(self):
        """Initialize OpenAI client"""
        try:
            api_key = os.environ.get('OPENAI_API_KEY')
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
                logger.info("Advanced AI initialized successfully")
            else:
                logger.warning("No OpenAI API key found for advanced AI")
        except Exception as e:
            logger.error(f"Failed to initialize Advanced AI: {str(e)}")
    
    def analyze_intent(self, user_input):
        """Analyze user intent and categorize the request"""
        intent_patterns = {
            "device_control": [
                r"open\s+(\w+)", r"start\s+(\w+)", r"launch\s+(\w+)",
                r"close\s+(\w+)", r"search\s+for\s+(.+)", r"browse\s+(.+)",
                r"create\s+file", r"make\s+folder", r"delete\s+(.+)"
            ],
            "advice_request": [
                r"what\s+should\s+i", r"how\s+can\s+i", r"help\s+me\s+with",
                r"advice\s+on", r"recommend", r"suggest", r"best\s+way"
            ],
            "information": [
                r"what\s+is", r"tell\s+me\s+about", r"explain", r"define",
                r"how\s+does", r"why\s+is", r"when\s+was"
            ],
            "task_assistance": [
                r"help\s+me", r"assist\s+with", r"guide\s+me", r"walk\s+through",
                r"show\s+me\s+how", r"teach\s+me"
            ],
            "conversation": [
                r"hello", r"hi", r"hey", r"good\s+morning", r"how\s+are\s+you",
                r"what's\s+up", r"chat", r"talk"
            ]
        }
        
        user_lower = user_input.lower()
        detected_intents = []
        
        for intent, patterns in intent_patterns.items():
            for pattern in patterns:
                if re.search(pattern, user_lower):
                    detected_intents.append(intent)
                    break
        
        return detected_intents[0] if detected_intents else "conversation"
    
    def generate_contextual_response(self, user_input, intent="conversation", context=None):
        """Generate intelligent responses based on context and intent"""
        if not self.openai_client:
            return self._generate_fallback_response(user_input, intent)
        
        try:
            # Build system message based on intent
            system_message = self._build_system_message(intent)
            
            # Add context to conversation
            messages = [system_message]
            
            # Add conversation history (last 5 exchanges)
            messages.extend(self.conversation_context[-10:])
            
            # Add current user input
            messages.append({"role": "user", "content": user_input})
            
            # Generate response
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=500,
                temperature=0.8,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Update conversation context
            self.conversation_context.append({"role": "user", "content": user_input})
            self.conversation_context.append({"role": "assistant", "content": ai_response})
            
            # Keep context manageable
            if len(self.conversation_context) > 20:
                self.conversation_context = self.conversation_context[-16:]
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Advanced AI response error: {str(e)}")
            return self._generate_fallback_response(user_input, intent)
    
    def _build_system_message(self, intent):
        """Build system message based on intent"""
        base_personality = """You are AVA CORE, an advanced AI assistant created by Ervin Radosavlevici. 
        You are intelligent, helpful, and capable of natural conversation. You can provide advice, 
        help with tasks, control devices, and assist with various projects."""
        
        intent_instructions = {
            "device_control": """Focus on helping with device control tasks. Provide clear instructions 
                              for opening applications, managing files, or controlling system functions.""",
            
            "advice_request": """Provide thoughtful, practical advice. Consider multiple perspectives 
                              and give actionable recommendations. Draw from expertise in business, 
                              technology, development, and life skills.""",
            
            "information": """Provide accurate, comprehensive information. Explain concepts clearly 
                           and include relevant examples or context.""",
            
            "task_assistance": """Guide the user step-by-step through tasks. Break down complex 
                                processes into manageable steps and provide helpful tips.""",
            
            "conversation": """Engage in natural, friendly conversation. Be personable while 
                            maintaining professionalism. Show genuine interest in the user's thoughts."""
        }
        
        system_content = base_personality + "\n\n" + intent_instructions.get(intent, intent_instructions["conversation"])
        
        return {"role": "system", "content": system_content}
    
    def _generate_fallback_response(self, user_input, intent):
        """Generate fallback responses when OpenAI is unavailable"""
        fallback_responses = {
            "device_control": "I can help you control your device. For full functionality, please ensure proper API access is configured.",
            "advice_request": f"For advice on '{user_input}', I recommend researching best practices and consulting with experts in that area.",
            "information": f"I'd be happy to help explain '{user_input}'. For detailed information, please ensure full AI capabilities are enabled.",
            "task_assistance": "I'm here to help guide you through tasks. Let me know what specific assistance you need.",
            "conversation": "I'm here to chat! What's on your mind today?"
        }
        
        return fallback_responses.get(intent, "I'm listening and ready to help with whatever you need.")
    
    def provide_business_advice(self, query):
        """Specialized business advice responses"""
        business_prompt = f"""
        As an expert business advisor, provide comprehensive advice for this query: {query}
        
        Include:
        1. Strategic recommendations
        2. Practical implementation steps
        3. Potential challenges and solutions
        4. Success metrics to track
        
        Keep advice actionable and relevant to modern business practices.
        """
        
        return self.generate_contextual_response(business_prompt, "advice_request")
    
    def provide_development_help(self, query):
        """Specialized software development assistance"""
        dev_prompt = f"""
        As an expert software developer, help with this development query: {query}
        
        Provide:
        1. Technical solution or explanation
        2. Code examples if relevant
        3. Best practices
        4. Common pitfalls to avoid
        
        Focus on clean, efficient, and maintainable solutions.
        """
        
        return self.generate_contextual_response(dev_prompt, "task_assistance")
    
    def analyze_task_complexity(self, task_description):
        """Analyze task complexity and provide breakdown"""
        if not self.openai_client:
            return "Task analysis requires full AI capabilities."
        
        try:
            analysis_prompt = f"""
            Analyze this task and provide a structured breakdown: {task_description}
            
            Provide JSON response with:
            {{
                "complexity": "low/medium/high",
                "estimated_time": "time estimate",
                "key_steps": ["step1", "step2", "step3"],
                "skills_needed": ["skill1", "skill2"],
                "potential_challenges": ["challenge1", "challenge2"],
                "success_criteria": ["criteria1", "criteria2"]
            }}
            """
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": analysis_prompt}],
                response_format={"type": "json_object"},
                max_tokens=400
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"Task analysis error: {str(e)}")
            return {"error": "Could not analyze task complexity"}
    
    def get_personalized_recommendations(self, category, user_context=None):
        """Generate personalized recommendations"""
        recommendations = {
            "productivity": [
                "Use time-blocking for focused work sessions",
                "Implement the 2-minute rule for quick tasks",
                "Create a distraction-free workspace",
                "Use the Pomodoro Technique for sustained focus"
            ],
            "learning": [
                "Set specific, measurable learning goals",
                "Practice active recall and spaced repetition",
                "Find a learning partner or mentor",
                "Apply knowledge through practical projects"
            ],
            "career": [
                "Build a strong professional network",
                "Continuously update your skills",
                "Seek feedback and mentorship opportunities",
                "Document your achievements and impact"
            ]
        }
        
        return recommendations.get(category, ["I'd be happy to provide personalized recommendations with more context."])
    
    def clear_context(self):
        """Clear conversation context"""
        self.conversation_context = []
        logger.info("Conversation context cleared")
    
    def save_user_preferences(self, preferences):
        """Save user preferences for personalization"""
        self.user_preferences.update(preferences)
        logger.info("User preferences updated")
    
    def get_capabilities(self):
        """Return AI capabilities"""
        return {
            "natural_conversation": True,
            "business_advice": True,
            "development_help": True,
            "task_analysis": True,
            "personalized_recommendations": True,
            "device_control_guidance": True,
            "openai_available": self.openai_client is not None,
            "expertise_areas": self.expertise_areas
        }