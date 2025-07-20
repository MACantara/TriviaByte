import json
from google import genai
from google.genai.types import Tool, GenerateContentConfig, GoogleSearch
from config.settings import Config  # Update import path
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        logger.info("Initializing AIService")
        self.client = genai.Client(api_key=Config.GEMINI_API_KEY)
        self.search_tool = Tool(google_search=GoogleSearch())
        
        self.base_config = {
            "temperature": 0.5,
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 8192,
            "tools": [self.search_tool],
            "response_modalities": ["TEXT"]
        }
        logger.debug("AIService initialized with gemini-2.5-flash")

    def generate_content(self, prompt, topic=None):
        """Generate content using Gemini API with built-in search"""
        try:
            enhanced_prompt = f"""
            Topic: {topic if topic else 'General'}
            
            {prompt}
            
            Note: Please use search to find accurate and up-to-date information.
            IMPORTANT: Return ONLY valid JSON in the exact format specified. Do not include any explanatory text before or after the JSON.
            """

            logger.debug("Generating content with Gemini API")
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=enhanced_prompt,
                config=GenerateContentConfig(
                    **self.base_config
                )
            )
            
            parsed_response = self._parse_response(response)
            
            # Log response details for debugging
            if parsed_response:
                logger.debug(f"Response received, length: {len(parsed_response)}")
                # Log first and last 200 characters for debugging
                if len(parsed_response) > 400:
                    logger.debug(f"Response preview: {parsed_response[:200]}...{parsed_response[-200:]}")
                else:
                    logger.debug(f"Response: {parsed_response}")
            else:
                logger.warning("Empty response received from AI service")
            
            return parsed_response
            
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}", exc_info=True)
            return ""

    def _parse_response(self, response):
        """Parse response from Gemini API with robust text extraction"""
        try:
            content = ""
            
            # Extract text content with multiple fallback methods
            if hasattr(response, 'text') and response.text:
                content = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                # Extract from candidates if available
                candidate = response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content:
                    if hasattr(candidate.content, 'parts') and candidate.content.parts:
                        content = candidate.content.parts[0].text
                    elif hasattr(candidate.content, 'text'):
                        content = candidate.content.text
                elif hasattr(candidate, 'text'):
                    content = candidate.text
            elif isinstance(response, str):
                content = response
            else:
                content = str(response)
            
            # Clean and validate the content
            if not content or not content.strip():
                logger.warning("Empty response received from AI service")
                return ""
            
            logger.debug(f"Extracted content length: {len(content)} characters")
            return content.strip()
            
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}", exc_info=True)
            return ""