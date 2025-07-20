// quizAPI.js - Handles all API calls for quiz generation and submission

const QuizAPI = {
    generateQuiz: async function(quizConfig) {
        try {
            const response = await $.ajax({
                url: '/generate',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(quizConfig)
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    saveQuestion: async function(question) {
        try {
            const response = await $.ajax({
                url: '/save-question',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(question)
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    saveAllQuestions: async function(questions) {
        try {
            const response = await $.ajax({
                url: '/save-all-questions',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ questions: questions })
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    getRandomQuestions: async function(difficulty = 'medium') {
        try {
            const response = await $.ajax({
                url: `/random-questions?difficulty=${difficulty}`,
                method: 'GET',
                contentType: 'application/json'
            });
            return response;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    parseQuizData: function(response) {
        try {
            let quizData;
            
            // Parse the response if it's a string
            if (typeof response === 'string') {
                quizData = this.parseJSONSafely(response);
            } else if (response.quiz) {
                // Handle response.quiz
                const rawQuiz = response.quiz;
                if (typeof rawQuiz === 'string') {
                    quizData = this.parseJSONSafely(this.cleanJSONString(rawQuiz));
                } else if (Array.isArray(rawQuiz)) {
                    quizData = { questions: rawQuiz };
                } else {
                    quizData = rawQuiz;
                }
            } else if (Array.isArray(response)) {
                // Direct array of questions
                quizData = { questions: response };
            } else {
                quizData = response;
            }

            // Validate the quiz data structure
            if (!quizData || typeof quizData !== 'object') {
                throw new Error('Quiz data must be an object');
            }

            // Ensure we have a questions array
            if (!quizData.questions) {
                if (Array.isArray(quizData)) {
                    quizData = { questions: quizData };
                } else {
                    throw new Error('Quiz data must contain questions');
                }
            }

            // Validate questions array
            if (!Array.isArray(quizData.questions)) {
                throw new Error('Questions must be an array');
            }

            // Sanitize and validate each question
            const validQuestions = this.sanitizeQuestions(quizData.questions);
            
            if (validQuestions.length === 0) {
                throw new Error('No valid questions found');
            }

            quizData.questions = validQuestions;

            // Process metadata and references for each question
            quizData.questions = quizData.questions.map(question => {
                // Extract references and explanations from response metadata
                if (question.metadata && question.metadata.grounding_chunks) {
                    question.references = question.metadata.grounding_chunks
                        .filter(chunk => chunk.web && chunk.web.uri)
                        .map(chunk => ({
                            title: chunk.web.title || 'Web Source',
                            url: chunk.web.uri
                        }));
                }
                
                // Extract search results if available
                if (question.metadata && question.metadata.search_entry_point) {
                    question.searchResults = question.metadata.search_entry_point.rendered_content;
                }
                
                // Ensure explanation exists and is properly formatted
                if (!question.explanation) {
                    question.explanation = {
                        text: "No explanation available.",
                        references: []
                    };
                } else if (typeof question.explanation === 'string') {
                    question.explanation = {
                        text: question.explanation,
                        references: []
                    };
                } else if (typeof question.explanation === 'object') {
                    // Ensure the explanation object has the correct structure
                    question.explanation = {
                        text: question.explanation.text || question.explanation.explanation || "No explanation available.",
                        references: question.explanation.references || []
                    };
                }
                
                return question;
            });

            return quizData;
        } catch (error) {
            console.error('Error parsing quiz data:', error);
            throw new Error('Failed to parse quiz data: ' + error.message);
        }
    },

    cleanJSONString: function(jsonStr) {
        if (!jsonStr) return '';
        
        let cleaned = jsonStr.trim();
        
        // Remove markdown code blocks
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.substring(7);
        }
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        
        cleaned = cleaned.trim();
        
        // Find JSON boundaries
        const firstBrace = cleaned.indexOf('{');
        const firstBracket = cleaned.indexOf('[');
        
        let startIndex = -1;
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIndex = firstBrace;
        } else if (firstBracket !== -1) {
            startIndex = firstBracket;
        }
        
        if (startIndex !== -1) {
            cleaned = cleaned.substring(startIndex);
        }
        
        return cleaned;
    },

    parseJSONSafely: function(jsonStr) {
        const strategies = [
            // Strategy 1: Direct parse
            () => JSON.parse(jsonStr),
            
            // Strategy 2: Clean and parse
            () => JSON.parse(this.cleanJSONString(jsonStr)),
            
            // Strategy 3: Fix common issues and parse
            () => {
                let fixed = this.fixCommonJSONIssues(jsonStr);
                return JSON.parse(fixed);
            },
            
            // Strategy 4: Extract JSON pattern and parse
            () => {
                const jsonPattern = /\{[\s\S]*\}/;
                const match = jsonStr.match(jsonPattern);
                if (match) {
                    return JSON.parse(match[0]);
                }
                throw new Error('No JSON pattern found');
            }
        ];
        
        let lastError = null;
        for (const strategy of strategies) {
            try {
                return strategy();
            } catch (error) {
                lastError = error;
                continue;
            }
        }
        
        throw new Error('All JSON parsing strategies failed. Last error: ' + lastError.message);
    },

    fixCommonJSONIssues: function(jsonStr) {
        let fixed = jsonStr;
        
        try {
            // Fix unterminated strings
            const lines = fixed.split('\n');
            const fixedLines = lines.map(line => {
                line = line.trim();
                if (!line || line === '{' || line === '}' || line === '[' || line === ']' || line === ',') {
                    return line;
                }
                
                // Count quotes
                const quoteCount = (line.match(/"/g) || []).length;
                if (quoteCount % 2 !== 0) {
                    // Odd number of quotes - likely unterminated string
                    if (line.endsWith(',')) {
                        line = line.slice(0, -1) + '",';
                    } else if (line.endsWith('}') || line.endsWith(']')) {
                        const lastChar = line.slice(-1);
                        line = line.slice(0, -1) + '"' + lastChar;
                    } else {
                        line = line + '"';
                    }
                }
                
                return line;
            });
            
            fixed = fixedLines.join('\n');
            
            // Fix missing commas
            fixed = fixed.replace(/"\s*\n\s*"/g, '",\n"');
            fixed = fixed.replace(/}\s*\n\s*{/g, '},\n{');
            
            // Fix trailing commas
            fixed = fixed.replace(/,\s*]/g, ']');
            fixed = fixed.replace(/,\s*}/g, '}');
            
        } catch (error) {
            console.warn('Error fixing JSON issues:', error);
        }
        
        return fixed;
    },

    sanitizeQuestions: function(questions) {
        if (!Array.isArray(questions)) {
            return [];
        }
        
        const validQuestions = [];
        const seenQuestions = new Set();
        
        for (const question of questions) {
            if (!question || typeof question !== 'object') {
                continue;
            }
            
            // Check required fields
            if (!question.question || !question.options || !question.correct_answer) {
                continue;
            }
            
            // Sanitize question text
            const questionText = String(question.question).trim();
            if (!questionText || seenQuestions.has(questionText)) {
                continue;
            }
            
            // Sanitize options
            if (!Array.isArray(question.options) || question.options.length !== 4) {
                continue;
            }
            
            const sanitizedOptions = question.options.map(option => String(option).trim()).filter(option => option);
            if (sanitizedOptions.length !== 4) {
                continue;
            }
            
            // Sanitize correct answer
            const correctAnswer = String(question.correct_answer).trim();
            if (!sanitizedOptions.includes(correctAnswer)) {
                continue;
            }
            
            // Sanitize difficulty
            const difficulty = (question.difficulty || 'medium').toLowerCase();
            const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
            
            seenQuestions.add(questionText);
            validQuestions.push({
                type: 'multiple_choice',
                question: questionText,
                options: sanitizedOptions,
                correct_answer: correctAnswer,
                difficulty: validDifficulty
            });
        }
        
        return validQuestions;
    }
};
