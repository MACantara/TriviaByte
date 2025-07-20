// quizLogic.js - Handles quiz logic and answer processing

const QuizLogic = {
    currentQuiz: null,

    // Initialize quiz event listeners
    init: function() {
        console.log('QuizLogic.init() called');
        this.setupFormSubmission();
        this.setupQuizSubmission();
        
        // Ensure startQuizWithDifficulty is available
        console.log('QuizLogic.startQuizWithDifficulty available:', typeof this.startQuizWithDifficulty);
    },

    // Setup form submission
    setupFormSubmission: function() {
        $('#quizForm').on('submit', async (e) => {
            e.preventDefault();
            
            // Get selected difficulty
            const selectedDifficulty = $('input[name="difficulty"]:checked').val() || 'medium';
            
            const quizConfig = {
                topic: $('#topic').val(),
                num_questions: $('#numQuestions').val(),
                question_types: ['multiple_choice'],
                difficulty: selectedDifficulty
            };

            QuizUI.showLoading();

            try {
                const response = await QuizAPI.generateQuiz(quizConfig);
                this.currentQuiz = QuizAPI.parseQuizData(response);
                QuizUI.displayQuiz(this.currentQuiz);
                $('#quizContainer').removeClass('hidden');
            } catch (error) {
                console.error('Error:', error);
                alert('Error generating quiz. Please try again.');
            } finally {
                QuizUI.hideLoading();
            }
        });
    },

    // Setup quiz submission
    setupQuizSubmission: function() {
        $(document).on('click', '#submitQuiz', () => {
            if (!this.currentQuiz) return;
            
            // Disable submit button and show loading state
            const $submitBtn = $('#submitQuiz');
            $submitBtn.prop('disabled', true)
                     .html('<span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>Submitting...');
            
            // Gather and submit answers
            const answers = this.gatherAnswers();
            
            if (answers.length !== this.currentQuiz.questions.length) {
                alert("Please answer all questions before submitting.");
                // Reset button state
                $submitBtn.prop('disabled', false)
                         .html('<i class="bi bi-check-circle mr-2"></i>Submit Answers');
                return;
            }
            
            // Submit with slight delay for UX
            setTimeout(() => {
                this.submitQuiz(answers);
            }, 500);
        });
    },

    // Function to start quiz with specific difficulty (called from level selection)
    startQuizWithDifficulty: async function(difficulty) {
        try {
            const response = await QuizAPI.getRandomQuestions(difficulty);
            if (response.status === 'success' && response.questions.length > 0) {
                GameUI.startGame(response.questions);
                return true;
            } else if (response.status === 'error') {
                // Show detailed error message with available difficulties
                let errorMessage = response.error || 'No questions available for this difficulty level.';
                
                if (response.available_difficulties) {
                    const availableDiffs = [];
                    for (const [diff, count] of Object.entries(response.available_difficulties)) {
                        if (count > 0) {
                            availableDiffs.push(`${diff} (${count} questions)`);
                        }
                    }
                    
                    if (availableDiffs.length > 0) {
                        errorMessage += `\n\nAvailable difficulty levels:\n${availableDiffs.join('\n')}`;
                        errorMessage += '\n\nPlease select a different difficulty level or ask an admin to add more questions.';
                    } else {
                        errorMessage += '\n\nNo questions available in any difficulty level. Please ask an admin to add questions to the database.';
                    }
                }
                
                alert(errorMessage);
                return false;
            } else {
                alert('No questions available for this difficulty level.');
                return false;
            }
        } catch (error) {
            console.error('Error:', error);
            
            // Handle different types of errors
            if (error.status === 404) {
                // Parse the error response if it's JSON and show detailed message
                try {
                    const errorData = error.responseJSON || JSON.parse(error.responseText);
                    let errorMessage = errorData.error || 'No questions found for this difficulty.';
                    
                    if (errorData.available_difficulties) {
                        const availableDiffs = [];
                        for (const [diff, count] of Object.entries(errorData.available_difficulties)) {
                            if (count > 0) {
                                availableDiffs.push(`${diff} (${count} questions)`);
                            }
                        }
                        
                        if (availableDiffs.length > 0) {
                            errorMessage += `\n\nAvailable difficulty levels:\n${availableDiffs.join('\n')}`;
                            errorMessage += '\n\nPlease select a different difficulty level.';
                        }
                    }
                    
                    alert(errorMessage);
                } catch (parseError) {
                    alert('No questions available for this difficulty level. Please try a different level or ask an admin to add more questions.');
                }
                return false;
            } else {
                // Only show generic error for non-404 errors
                alert('Error loading questions. Please try again.');
                return false;
            }
        }
    },

    submitQuiz: function(answers) {
        const quizData = this.currentQuiz;
        
        const resultsDetails = answers.map((answer, index) => {
            const question = quizData.questions[index];
            const isCorrect = this.compareAnswers(answer.userAnswer, question.correct_answer);
            
            return {
                questionText: question.question,
                userAnswer: answer.userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: isCorrect,
                type: 'multiple_choice',
                options: question.options
            };
        });

        // Scroll to top before showing results
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Show results after scroll
        setTimeout(() => {
            QuizUI.displayResults(resultsDetails);
        }, 300);
    },

    gatherAnswers: function() {
        const answers = [];
        const seenQuestions = new Set();

        this.currentQuiz.questions.forEach((question, index) => {
            if (seenQuestions.has(question.question)) return;
            seenQuestions.add(question.question);

            const userAnswer = $(`[name="q${index}"]:checked`).val();
            // Use correct_answer field for validation
            answers.push({
                questionText: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: this.compareAnswers(userAnswer, question.correct_answer),
                type: 'multiple_choice',
                options: question.options
            });
        });
        return answers;
    },

    compareAnswers: function(userAnswer, correctAnswer) {
        if (!userAnswer) return false;
        return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
    }
};

// Make sure QuizLogic is globally available and initialize when DOM is ready
window.QuizLogic = QuizLogic;

// Ensure the startQuizWithDifficulty function is accessible
$(document).ready(function() {
    // Double-check that QuizLogic is properly initialized
    if (typeof window.QuizLogic === 'object' && typeof window.QuizLogic.startQuizWithDifficulty === 'function') {
        console.log('✅ QuizLogic.startQuizWithDifficulty is ready and accessible');
    } else {
        console.error('❌ QuizLogic.startQuizWithDifficulty is not available');
        console.log('QuizLogic type:', typeof window.QuizLogic);
        console.log('startQuizWithDifficulty type:', typeof window.QuizLogic?.startQuizWithDifficulty);
    }
});
