// quizLogic.js - Handles quiz logic and answer processing

const QuizLogic = {
    currentQuiz: null,

    // Initialize quiz event listeners
    init: function() {
        this.setupFormSubmission();
        this.setupQuizSubmission();
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

    submitQuiz: function(answers) {
        const quizData = this.currentQuiz;
        
        if (answers.length !== quizData.questions.length) {
            alert("Please answer all questions before submitting.");
            return;
        }

        const resultsDetails = answers.map((answer, index) => {
            const question = quizData.questions[index];
            const isCorrect = this.compareAnswers(answer.userAnswer, question.correct_answer);
            
            return {
                questionText: question.question,
                userAnswer: answer.userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: isCorrect,
                explanation: question.explanation?.text || "No explanation available.",
                references: question.explanation?.references || [],
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
            answers.push({
                questionText: question.question,
                userAnswer: userAnswer,
                correctAnswer: question.correct_answer,
                isCorrect: this.compareAnswers(userAnswer, question.correct_answer),
                type: 'multiple_choice',
                explanation: question.explanation,
                references: question.references || []
            });
        });
        return answers;
    },

    compareAnswers: function(userAnswer, correctAnswer) {
        if (!userAnswer) return false;
        return String(userAnswer).toLowerCase() === String(correctAnswer).toLowerCase();
    }
};
