// quizUI.js - Handles all UI-related functionality

const QuizUI = {
    // Utility function to shuffle an array
    shuffleArray: function(array) {
        const shuffledArray = [...array];
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    },

    // Show loading state
    showLoading: function() {
        $('#quizContainer').addClass('d-none');
        $('button[type="submit"]').prop('disabled', true).html(
            '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...'
        );
    },

    // Hide loading state
    hideLoading: function() {
        $('button[type="submit"]').prop('disabled', false).text('Generate Quiz');
    },

    // Display multiple choice question
    displayMultipleChoice: function(question, index, questionBody) {
        const shuffledOptions = this.shuffleArray(question.options);
        const mcOptions = $('<div>').addClass('d-grid gap-3');
        shuffledOptions.forEach((option, optionIndex) => {
            mcOptions.append(`
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" id="q${index}_${optionIndex}" value="${option}">
                    <label class="form-check-label py-2 px-3 bg-light rounded-3 w-100 fw-medium" for="q${index}_${optionIndex}">${option}</label>
                </div>
            `);
        });
        questionBody.append(mcOptions);
    },

    // Display quiz questions
    displayQuiz: function(quiz) {
        const questionsContainer = $('#questions');
        questionsContainer.empty();

        quiz.questions.forEach((question, index) => {
            const questionDiv = $('<div>').addClass('card border-0 shadow-sm rounded-3 mb-4');
            const questionBody = $('<div>').addClass('card-body p-4');
            
            // Add question header with save button
            const headerDiv = $('<div>').addClass('d-flex justify-content-between align-items-center mb-4');
            headerDiv.append(
                $('<h5>').addClass('fw-bold mb-0').text(`Question ${index + 1}`),
                $('<button>')
                    .addClass('btn btn-outline-primary shadow-sm')
                    .attr('data-question-index', index)
                    .html('<i class="fas fa-save me-2"></i>Save')
                    .on('click', () => this.handleSaveQuestion(question))
            );
            questionBody.append(headerDiv);
            
            questionBody.append($('<p>').addClass('card-text mb-4').text(question.question));
            this.displayMultipleChoice(question, index, questionBody);

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add submit button
        questionsContainer.append(`
            <button id="submitQuiz" class="btn btn-primary btn-lg w-100 shadow-sm">
                <i class="fas fa-check-circle me-2"></i>Submit Answers
            </button>
        `);
    },

    handleSaveQuestion: async function(question) {
        try {
            const response = await QuizAPI.saveQuestion(question);
            if (response.status === 'success') {
                // Show success notification
                alert('Question saved successfully!');
            }
        } catch (error) {
            console.error('Error saving question:', error);
            alert('Failed to save question. Please try again.');
        }
    },

    // Display quiz results
    displayResults: function(answers) {
        const questionsContainer = $('#questions');
        questionsContainer.empty();
        
        // Add score summary at the top
        const correctCount = answers.filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / answers.length) * 100);
        questionsContainer.prepend(`
            <div class="card border-0 shadow-sm rounded-3 mb-4">
                <div class="card-body p-4 text-center">
                    <h3 class="fw-bold mb-3">Quiz Results</h3>
                    <div class="display-4 text-primary fw-bold mb-2">${score}%</div>
                    <div class="text-muted">${correctCount} out of ${answers.length} correct</div>
                </div>
            </div>
        `);

        // Display each question with results
        answers.forEach((answer, index) => {
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
            // Question header with badge
            const badge = $('<span>')
                .addClass(`badge ${answer.isCorrect ? 'bg-success' : 'bg-danger'} ms-2`)
                .text(answer.isCorrect ? 'Correct' : 'Incorrect');
            
            questionBody.append(
                $('<div>')
                    .addClass('d-flex justify-content-between align-items-center mb-3')
                    .append(
                        $('<h5>').addClass('card-title mb-0').text(`Question ${index + 1}`),
                        badge
                    )
            );

            // Question text
            questionBody.append($('<p>').addClass('card-text mb-3').text(answer.questionText));

            // Display answer options based on question type
            this.displayResultAnswers(answer, questionBody);

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add restart button
        questionsContainer.append(
            $('<button>')
                .addClass('btn btn-primary btn-lg w-100 mt-4 shadow-sm')
                .html('<i class="fas fa-redo me-2"></i>Start New Quiz')
                .on('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                        $('#quizForm').trigger('reset');
                        $('#quizContainer').addClass('d-none');
                        $('.card.mb-4').removeClass('d-none');
                    }, 300);
                })
        );
    },

    displayResultAnswers: function(answer, container) {
        const answersSection = $('<div>').addClass('mb-3');
        this.displayMCResult(answer, answersSection);
        container.append(answersSection);
    },

    displayMCResult: function(answer, container) {
        const options = answer.options;
        
        options.forEach(option => {
            const isUserAnswer = String(answer.userAnswer).toLowerCase() === String(option).toLowerCase();
            const isCorrectAnswer = String(answer.correctAnswer).toLowerCase() === String(option).toLowerCase();
            
            const optionDiv = $('<div>')
                .addClass('form-check mb-2 p-2 rounded')
                .toggleClass('bg-success bg-opacity-10', isCorrectAnswer)
                .toggleClass('border border-2', isUserAnswer)
                .toggleClass('border-success', isUserAnswer && isCorrectAnswer)
                .toggleClass('border-danger', isUserAnswer && !isCorrectAnswer);
            
            optionDiv.append(
                $('<div>').addClass('d-flex align-items-center').append(
                    $('<input>')
                        .addClass('form-check-input me-2')
                        .attr({
                            type: 'radio',
                            disabled: true,
                            checked: isUserAnswer
                        }),
                    $('<label>')
                        .addClass('form-check-label flex-grow')
                        .text(option),
                    isUserAnswer && $('<i>')
                        .addClass(`fas fa-${isCorrectAnswer ? 'check text-success' : 'times text-danger'} ms-2`)
                )
            );
            
            container.append(optionDiv);
        });
    },

    isValidUrl: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    getSourceName: function(url) {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace(/^www\./, '');
        } catch {
            return 'source';
        }
    },
};