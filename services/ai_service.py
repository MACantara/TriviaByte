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
            """

            logger.debug("Generating content with Gemini API")
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=enhanced_prompt,
                config=GenerateContentConfig(
                    **self.base_config
                )
            )
            
            return self._parse_response(response)
            
        except Exception as e:
            logger.error(f"Error generating content: {str(e)}", exc_info=True)
            return ""

    def _parse_response(self, response):
        """Parse response from Gemini API"""
        try:
            content = ""
            metadata_results = []

            # Extract text content
            if hasattr(response, 'text'):
                content = response.text
            elif isinstance(response, str):
                content = response
            else:
                content = str(response)

            return content
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}", exc_info=True)
            return ""