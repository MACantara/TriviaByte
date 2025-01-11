import json
from services.ai_service import AIService

class QuizService:
    def __init__(self):
        self.ai_service = AIService()

    def _create_prompt(self, topic, num_questions, question_types):
        return f"""Generate a quiz about {topic} containing exactly {num_questions} multiple choice questions.
        
        Strictly follow these rules:
        - Challenge users with critical thinking, reading comprehension, and problem-solving
        - Balance the difficulty of questions to progressively challenge learners while being fair
        - Each question must have exactly 4 options
        - One and only one option must be correct
        - All options must be plausible and related to the topic
        - Don't use options like "All of the above" or "None of the above"

        Return a valid JSON object with the following structure:
        {{"questions": [
            {{
                "type": "multiple_choice",
                "question": "question_text",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": "correct_option"
            }}
        ]}}
        """

    def _clean_response(self, text):
        # Clean the response to ensure it's valid JSON
        text = text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        return text.strip()
    
    def generate_quiz(self, topic, num_questions, question_types):
        try:
            # Remove max limit check, keep minimum of 1
            num_questions = max(int(num_questions), 1)
            prompt = self._create_prompt(topic, num_questions, question_types)
            
            # Pass topic for context-aware generation
            response = self.ai_service.generate_content(prompt, topic=topic)
            
            # Handle different response types
            if hasattr(response, 'text'):
                cleaned_text = self._clean_response(response.text)
            elif isinstance(response, str):
                cleaned_text = self._clean_response(response)
            else:
                cleaned_text = self._clean_response(str(response))
            
            # Parse and validate the JSON
            quiz_data = json.loads(cleaned_text)
            
            # Ensure we have a questions array
            if not isinstance(quiz_data, dict) or 'questions' not in quiz_data:
                if isinstance(quiz_data, list):
                    quiz_data = {'questions': quiz_data}
                else:
                    raise ValueError("Invalid quiz data format")
            
            return quiz_data['questions']
        except Exception as e:
            print(f"Error parsing quiz response: {e}")
            print(f"Raw response: {response.text if 'response' in locals() else 'No response generated'}")
            return '{"questions": []}'  # Return empty quiz on error
