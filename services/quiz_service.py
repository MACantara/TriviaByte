import json
from services.ai_service import AIService
from services.database_service import DatabaseService

class QuizService:
    def __init__(self):
        self.ai_service = AIService()

    def _create_prompt(self, topic, num_questions, question_types, difficulty='medium'):
        difficulty_descriptions = {
            'easy': 'basic knowledge that most people would know, suitable for beginners',
            'medium': 'moderate difficulty requiring some general knowledge',
            'hard': 'challenging questions requiring deeper knowledge or expertise'
        }
        
        difficulty_desc = difficulty_descriptions.get(difficulty, 'moderate difficulty')
        
        return f"""Generate {num_questions} {difficulty} difficulty general knowledge multiple choice questions that test a broad understanding of {topic}.
        
        Difficulty Level: {difficulty.upper()} - Questions should be {difficulty_desc}.
        
        Strictly follow these rules:
        - Questions should cover diverse aspects of {topic} that an educated person might know
        - Adjust complexity based on difficulty: {difficulty_desc}
        - Include a mix of historical facts, current events, cultural significance, and practical applications
        - Make questions engaging and interesting, not just dry facts
        - Each question must have exactly 4 options
        - One and only one option must be correct
        - All options must be plausible and related to the question
        - Don't use options like "All of the above" or "None of the above"
        - Keep questions accessible to a general audience while being informative

        Return a valid JSON object with the following structure:
        {{"questions": [
            {{
                "type": "multiple_choice",
                "question": "question_text",
                "options": ["option1", "option2", "option3", "option4"],
                "correct_answer": "correct_option",
                "difficulty": "{difficulty}"
            }}
        ]}}
        
        IMPORTANT: 
        - Return ONLY the JSON object, no additional text
        - Ensure all strings are properly quoted
        - Each question must have exactly 4 options
        - The correct_answer must exactly match one of the options
        - Use proper JSON formatting with no trailing commas
        """

    def _clean_response(self, text):
        """Clean the response to ensure it's valid JSON with comprehensive error handling"""
        if not text or not text.strip():
            return ""
        
        text = text.strip()
        
        # Remove common markdown code block markers
        if text.startswith('```json'):
            text = text[7:]
        elif text.startswith('```'):
            text = text[3:]
        
        if text.endswith('```'):
            text = text[:-3]
        
        text = text.strip()
        
        # Find JSON boundaries more robustly
        try:
            # Look for the first { or [ to start JSON
            start_idx = -1
            for i, char in enumerate(text):
                if char in '{[':
                    start_idx = i
                    break
            
            if start_idx == -1:
                # No JSON start found
                return ""
            
            # Find the matching closing bracket
            bracket_count = 0
            brace_count = 0
            end_idx = -1
            start_char = text[start_idx]
            
            for i in range(start_idx, len(text)):
                char = text[i]
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                elif char == '[':
                    bracket_count += 1
                elif char == ']':
                    bracket_count -= 1
                
                # Check if we've closed all brackets/braces
                if start_char == '{' and brace_count == 0 and i > start_idx:
                    end_idx = i
                    break
                elif start_char == '[' and bracket_count == 0 and i > start_idx:
                    end_idx = i
                    break
            
            if end_idx != -1:
                text = text[start_idx:end_idx + 1]
            else:
                text = text[start_idx:]
            
            # Additional cleaning
            text = text.strip()
            
            # Fix common JSON issues
            text = self._fix_json_issues(text)
            
            return text
        except Exception as e:
            print(f"Error cleaning response: {e}")
            return text.strip()
    
    def _fix_json_issues(self, text):
        """Fix common JSON formatting issues"""
        try:
            import re
            
            # Remove trailing commas before closing brackets/braces
            text = re.sub(r',(\s*[}\]])', r'\1', text)
            
            # Fix empty arrays that start with comma
            text = re.sub(r'\[\s*,', '[', text)
            
            # Fix arrays/objects that start with comma after opening bracket
            text = re.sub(r'(\[|\{)\s*,', r'\1', text)
            
            # Fix multiple consecutive commas
            text = re.sub(r',\s*,+', ',', text)
            
            # Fix unterminated strings by adding missing quotes
            lines = text.split('\n')
            fixed_lines = []
            
            for line in lines:
                original_line = line
                line = line.strip()
                if not line:
                    continue
                
                # Skip lines that are just structural JSON
                if line in ['{', '}', '[', ']', ',']:
                    fixed_lines.append(line)
                    continue
                
                # Count quotes to detect unterminated strings
                quote_count = line.count('"')
                if quote_count > 0 and quote_count % 2 != 0:
                    # Odd number of quotes - likely unterminated string
                    if line.endswith(','):
                        line = line[:-1] + '",'
                    elif line.endswith('}') or line.endswith(']'):
                        last_char = line[-1]
                        line = line[:-1] + '"' + last_char
                    else:
                        line = line + '"'
                
                fixed_lines.append(line)
            
            result = '\n'.join(fixed_lines)
            
            # Final cleanup of trailing commas
            result = re.sub(r',(\s*[}\]])', r'\1', result)
            
            return result
        except Exception as e:
            print(f"Error fixing JSON issues: {e}")
            return text
    
    def _advanced_json_repair(self, text):
        """Advanced JSON repair using regular expressions"""
        try:
            import re
            
            # Start with basic fixes
            repaired = self._fix_json_issues(text)
            
            # More aggressive comma fixing
            # Remove trailing commas before any closing bracket or brace
            repaired = re.sub(r',\s*(?=[}\]])', '', repaired)
            
            # Fix cases where there's a comma right after opening bracket
            repaired = re.sub(r'(\[|\{)\s*,', r'\1', repaired)
            
            # Fix missing commas between array elements (simple heuristic)
            # Look for pattern: "text" followed by newline and quote (missing comma)
            repaired = re.sub(r'("\s*)\n\s*(?=")', r'\1,\n', repaired)
            
            # Fix missing commas between object properties
            repaired = re.sub(r'(},?\s*)\n\s*(?=")', r'},\n', repaired)
            
            # Remove any double commas that might have been introduced
            repaired = re.sub(r',,+', ',', repaired)
            
            # Final cleanup pass
            repaired = re.sub(r',(\s*[}\]])', r'\1', repaired)
            
            # Validate that we have proper JSON structure
            brace_count = repaired.count('{') - repaired.count('}')
            bracket_count = repaired.count('[') - repaired.count(']')
            
            if brace_count != 0 or bracket_count != 0:
                print(f"Warning: Unbalanced braces ({brace_count}) or brackets ({bracket_count})")
                return None
            
            return repaired
            
        except Exception as e:
            print(f"Error in advanced JSON repair: {e}")
            return None
    
    def _debug_json_repair(self, text):
        """Debug version with detailed logging"""
        try:
            import re
            
            print("=== Debug JSON Repair ===")
            print(f"Original length: {len(text)}")
            
            # Step 1: Remove trailing commas
            step1 = re.sub(r',(\s*[}\]])', r'\1', text)
            changes1 = len(re.findall(r',\s*[}\]]', text))
            print(f"Step 1: Removed {changes1} trailing commas")
            
            # Step 2: Fix leading commas in arrays
            step2 = re.sub(r'(\[|\{)\s*,', r'\1', step1)
            changes2 = len(re.findall(r'(\[|\{)\s*,', step1))
            print(f"Step 2: Fixed {changes2} leading commas")
            
            # Step 3: Remove multiple consecutive commas
            step3 = re.sub(r',\s*,+', ',', step2)
            changes3 = len(re.findall(r',\s*,+', step2))
            print(f"Step 3: Fixed {changes3} consecutive commas")
            
            # Step 4: Fix array beginnings with comma
            step4 = re.sub(r'\[\s*,', '[', step3)
            changes4 = len(re.findall(r'\[\s*,', step3))
            print(f"Step 4: Fixed {changes4} arrays starting with comma")
            
            print(f"Final length: {len(step4)}")
            
            # Test if it's valid JSON
            try:
                json.loads(step4)
                print("✅ Repaired JSON is valid!")
                return step4
            except json.JSONDecodeError as e:
                print(f"❌ Repaired JSON still invalid: {e}")
                # Show problematic area
                error_pos = getattr(e, 'pos', 0)
                start = max(0, error_pos - 50)
                end = min(len(step4), error_pos + 50)
                print(f"Problem area: {step4[start:end]}")
                return None
                
        except Exception as e:
            print(f"Error in debug repair: {e}")
            return None
    
    def _validate_and_sanitize_questions(self, questions_data):
        """Validate and sanitize questions data"""
        if not isinstance(questions_data, list):
            return []
        
        sanitized_questions = []
        
        for question in questions_data:
            if not isinstance(question, dict):
                continue
            
            # Check required fields
            if 'question' not in question or 'options' not in question or 'correct_answer' not in question:
                continue
            
            # Sanitize question text
            question_text = str(question['question']).strip()
            if not question_text:
                continue
            
            # Sanitize options
            options = question.get('options', [])
            if not isinstance(options, list) or len(options) != 4:
                continue
            
            sanitized_options = []
            for option in options:
                option_text = str(option).strip()
                if option_text:
                    sanitized_options.append(option_text)
            
            if len(sanitized_options) != 4:
                continue
            
            # Sanitize correct answer
            correct_answer = str(question['correct_answer']).strip()
            if correct_answer not in sanitized_options:
                continue
            
            # Get difficulty or default to provided difficulty
            difficulty = question.get('difficulty', 'medium').lower()
            if difficulty not in ['easy', 'medium', 'hard']:
                difficulty = 'medium'
            
            sanitized_questions.append({
                'type': 'multiple_choice',
                'question': question_text,
                'options': sanitized_options,
                'correct_answer': correct_answer,
                'difficulty': difficulty
            })
        
        return sanitized_questions
    
    def generate_quiz(self, topic, num_questions, question_types, difficulty='medium'):
        try:
            # Remove max limit check, keep minimum of 1
            num_questions = max(int(num_questions), 1)
            prompt = self._create_prompt(topic, num_questions, question_types, difficulty)
            
            # Pass topic for context-aware generation
            response = self.ai_service.generate_content(prompt, topic=topic)
            
            # Handle different response types
            if hasattr(response, 'text'):
                cleaned_text = self._clean_response(response.text)
            elif isinstance(response, str):
                cleaned_text = self._clean_response(response)
            else:
                cleaned_text = self._clean_response(str(response))
            
            if not cleaned_text:
                print("Error: No content received from AI service")
                return []
            
            # Try multiple parsing strategies
            quiz_data = None
            parsing_errors = []
            
            # Strategy 1: Direct JSON parsing
            try:
                quiz_data = json.loads(cleaned_text)
            except json.JSONDecodeError as e:
                parsing_errors.append(f"Direct parsing failed: {e}")
                
                # Strategy 2: Try to extract JSON from text using regex
                try:
                    import re
                    # More comprehensive regex to find complete JSON objects
                    json_pattern = r'\{(?:[^{}]|{[^{}]*})*\}'
                    matches = re.findall(json_pattern, cleaned_text, re.DOTALL)
                    if matches:
                        # Try the longest match first
                        matches.sort(key=len, reverse=True)
                        for match in matches:
                            try:
                                # Clean the match before parsing
                                cleaned_match = self._fix_json_issues(match)
                                quiz_data = json.loads(cleaned_match)
                                break
                            except json.JSONDecodeError:
                                continue
                except Exception as e2:
                    parsing_errors.append(f"Regex extraction failed: {e2}")
                
                # Strategy 3: Try to fix common JSON issues and parse again
                if not quiz_data:
                    try:
                        fixed_text = self._fix_json_issues(cleaned_text)
                        quiz_data = json.loads(fixed_text)
                    except json.JSONDecodeError as e3:
                        parsing_errors.append(f"Fixed JSON parsing failed: {e3}")
                
                # Strategy 4: Advanced regex-based repair and extraction
                if not quiz_data:
                    try:
                        repaired_text = self._advanced_json_repair(cleaned_text)
                        if repaired_text:
                            quiz_data = json.loads(repaired_text)
                    except json.JSONDecodeError as e4:
                        parsing_errors.append(f"Advanced repair failed: {e4}")
            
            if not quiz_data:
                print(f"Error parsing quiz response after all strategies. Errors: {'; '.join(parsing_errors)}")
                print(f"Raw response (first 500 chars): {cleaned_text[:500]}")
                
                # Final attempt with detailed debug info
                try:
                    print("Attempting final detailed repair...")
                    final_attempt = self._debug_json_repair(cleaned_text)
                    if final_attempt:
                        quiz_data = json.loads(final_attempt)
                        print("✅ Final repair attempt succeeded!")
                except Exception as final_e:
                    print(f"Final repair attempt failed: {final_e}")
                
                if not quiz_data:
                    return []
            
            # Ensure we have a questions array
            if not isinstance(quiz_data, dict) or 'questions' not in quiz_data:
                if isinstance(quiz_data, list):
                    quiz_data = {'questions': quiz_data}
                else:
                    print(f"Invalid quiz data format: {type(quiz_data)}")
                    return []
            
            # Validate and sanitize questions
            questions = self._validate_and_sanitize_questions(quiz_data['questions'])
            
            if not questions:
                print("No valid questions found after sanitization")
                return []
            
            print(f"Successfully generated {len(questions)} questions")
            return questions
            
        except Exception as e:
            print(f"Error generating quiz: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback: return empty list so the UI can handle it gracefully
            return []
