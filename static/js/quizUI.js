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
        const mcOptions = $('<div>').addClass('options');
        shuffledOptions.forEach((option, optionIndex) => {
            mcOptions.append(`
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="q${index}" id="q${index}_${optionIndex}" value="${option}">
                    <label class="form-check-label w-100 cursor-pointer" for="q${index}_${optionIndex}">${option}</label>
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
            const questionDiv = $('<div>').addClass('card mb-3');
            const questionBody = $('<div>').addClass('card-body');
            
            // Add question number header
            const questionHeader = $('<div>')
                .addClass('d-flex align-items-center mb-3')
                .append(
                    $('<h5>')
                        .addClass('card-title mb-0')
                        .text(`Question ${index + 1}`)
                );
            questionBody.append(questionHeader);
            
            questionBody.append($('<p>').addClass('card-text').text(question.question));
            this.displayMultipleChoice(question, index, questionBody);

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });
    },

    // Display quiz results
    displayResults: function(answers) {
        const questionsContainer = $('#questions');
        questionsContainer.empty();
        
        // Add score summary at the top
        const correctCount = answers.filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / answers.length) * 100);
        questionsContainer.prepend(
            $('<div>')
                .addClass('alert alert-info mb-4')
                .html(`
                    <h4 class="alert-heading">Quiz Results</h4>
                    <p class="mb-0">
                        <span class="h2">${score}%</span><br>
                        <span class="text-muted">${correctCount} out of ${answers.length} correct</span>
                    </p>
                `)
        );

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
                .addClass('btn btn-primary mt-3')
                .text('Start New Quiz')
                .on('click', () => {
                    $('#quizForm').trigger('reset');
                    $('#quizContainer').addClass('d-none');
                })
        );
    },

    displayReferenceSection: function(references, container) {
        if (!references || references.length === 0) return;
        
        const refsSection = $('<div>').addClass('mt-3 p-3 bg-light rounded');
        const refsList = $('<div>').addClass('reference-list');
        
        references.forEach(ref => {
            if (ref.url && ref.title) {
                refsList.append(
                    $('<div>').addClass('reference-item mb-2').append(
                        $('<a>')
                            .attr({
                                href: ref.url,
                                target: '_blank',
                                rel: 'noopener noreferrer'
                            })
                            .addClass('text-decoration-none')
                            .html(`<i class="fas fa-external-link-alt me-2"></i>${ref.title}`)
                    )
                );
            }
        });
        
        if (refsList.children().length > 0) {
            refsSection
                .append($('<h6>').addClass('mb-3').text('Sources:'))
                .append(refsList);
            container.append(refsSection);
        }
    },

    displayResultAnswers: function(answer, container) {
        const answersSection = $('<div>').addClass('answers-section mb-4');
        this.displayMCResult(answer, answersSection);
        
        // Add explanation immediately after answers
        if (answer.explanation) {
            const explanationSection = $('<div>')
                .addClass('explanation-section mt-3 p-3 bg-light border rounded')
                .append(
                    $('<h6>').addClass('mb-2').text('Explanation:'),
                    $('<p>').addClass('mb-2').text(answer.explanation)
                );
            
            // Add references if available
            if (answer.references && answer.references.length > 0) {
                this.displayReferenceSection(answer.references, explanationSection);
            }
            
            answersSection.append(explanationSection);
        }

        container.append(answersSection);
    },

    displayMCResult: function(answer, container) {
        const options = answer.type === 'true_false' ? ['True', 'False'] : answer.options;
        
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
                        .addClass('form-check-label flex-grow-1')
                        .text(option),
                    isUserAnswer && $('<i>')
                        .addClass(`fas fa-${isCorrectAnswer ? 'check text-success' : 'times text-danger'} ms-2`)
                )
            );
            
            container.append(optionDiv);
        });
    },

    createAnswerHeader: function(index, badge) {
        return $('<div>')
            .addClass('d-flex align-items-center mb-2')
            .append(
                $('<strong>').text(`Question ${index + 1}`),
                badge
            );
    },

    createAnswerDetails: function(answer) {
        return $('<div>').append(
            $('<div>').addClass('question-text mb-2').text(answer.questionText),
            $('<div>').addClass('user-answer').html(`
                <strong>Your answer:</strong> 
                ${Array.isArray(answer.userAnswer) ? answer.userAnswer.join(', ') : answer.userAnswer || 'No answer provided'}
            `),
            $('<div>').addClass('correct-answer').html(`
                <strong>Correct answer:</strong> 
                ${Array.isArray(answer.correctAnswer) ? answer.correctAnswer.join(', ') : answer.correctAnswer}
            `)
        );
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