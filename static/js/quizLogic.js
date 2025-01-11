// quizLogic.js - Handles quiz logic and answer processing

const QuizLogic = {
    currentQuiz: null,

    // Initialize quiz event listeners
    init: function() {
        this.setupFormSubmission();
        this.setupQuizSubmission();
        this.setupRandomQuiz();
    },

    // Setup form submission
    setupFormSubmission: function() {
        $('#quizForm').on('submit', async (e) => {
            e.preventDefault();
            
            const quizConfig = {
                topic: $('#topic').val(),
                num_questions: $('#numQuestions').val(),
                question_types: ['multiple_choice']
            };

            QuizUI.showLoading();

            try {
                const response = await QuizAPI.generateQuiz(quizConfig);
                this.currentQuiz = QuizAPI.parseQuizData(response);
                QuizUI.displayQuiz(this.currentQuiz);
                $('#quizContainer').removeClass('d-none');
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
        $('#submitQuiz').off('click').on('click', () => {
            if (!this.currentQuiz) return;
            const answers = this.gatherAnswers();
            this.submitQuiz(answers);
        });
    },

    setupRandomQuiz: function() {
        $('#randomQuiz').on('click', async (e) => {
            e.preventDefault();
            QuizUI.showLoading();

            try {
                const response = await QuizAPI.getRandomQuestions();
                if (response.status === 'success' && response.questions.length > 0) {
                    this.currentQuiz = { questions: response.questions };
                    QuizUI.displayQuiz(this.currentQuiz);
                    $('#quizContainer').removeClass('d-none');
                } else {
                    alert('No questions available. Try generating new ones!');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error loading random questions. Please try again.');
            } finally {
                QuizUI.hideLoading();
            }
        });
    },

    submitQuiz: function(answers) {
        const quizData = this.currentQuiz;
        
        if (answers.length !== quizData.questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        const resultsDetails = answers.map((answer, index) => {
            const question = quizData.questions[index];
            // Use correct_answer field for checking
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

        QuizUI.displayResults(resultsDetails);
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
