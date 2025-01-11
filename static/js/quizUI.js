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
                    <label class="form-check-label" for="q${index}_${optionIndex}">${option}</label>
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
            questionBody.append(
                $('<h5>').addClass('card-title mb-3').text(`Question ${index + 1}`)
            );
            
            questionBody.append($('<p>').addClass('card-text mb-3').text(question.question));
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
                .addClass('btn btn-primary w-100 mt-3')
                .text('Start New Quiz')
                .on('click', () => {
                    $('#quizForm').trigger('reset');
                    $('#quizContainer').addClass('d-none');
                })
        );
    },

    displayReferenceSection: function(references, container) {
        if (!references || references.length === 0) return;
        
        const refsSection = $('<div>').addClass('mt-4 border-t border-gray-200 pt-4');
        const refsList = $('<div>').addClass('space-y-2');
        
        references.forEach(ref => {
            if (ref.url && ref.title) {
                refsList.append(
                    $('<a>')
                        .attr({
                            href: ref.url,
                            target: '_blank',
                            rel: 'noopener noreferrer'
                        })
                        .addClass('text-sm text-blue-600 hover:text-blue-800 flex items-center')
                        .html(`<i class="fas fa-external-link-alt mr-2"></i>${ref.title}`)
                );
            }
        });
        
        if (refsList.children().length > 0) {
            refsSection
                .append($('<h6>').addClass('text-sm font-medium text-gray-900 mb-2').text('Sources:'))
                .append(refsList);
            container.append(refsSection);
        }
    },

    displayResultAnswers: function(answer, container) {
        const answersSection = $('<div>').addClass('mb-3');
        this.displayMCResult(answer, answersSection);
        
        // Add explanation immediately after answers
        if (answer.explanation) {
            const explanationSection = $('<div>')
                .addClass('alert alert-light mt-3')
                .append(
                    $('<h6>').addClass('alert-heading mb-2').text('Explanation:'),
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
                .addClass(`p-3 rounded-md flex items-center space-x-2 ${
                    isCorrectAnswer ? 'bg-green-50 border border-green-200' :
                    (isUserAnswer && !isCorrectAnswer) ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                }`);
            
            optionDiv.append(
                $('<input>')
                    .addClass('h-4 w-4 text-blue-600')
                    .attr({
                        type: 'radio',
                        disabled: true,
                        checked: isUserAnswer
                    }),
                $('<span>')
                    .addClass('flex-grow text-sm')
                    .text(option)
            );
            
            if (isUserAnswer || isCorrectAnswer) {
                optionDiv.append(
                    $('<i>')
                        .addClass(`fas fa-${isCorrectAnswer ? 'check text-green-600' : 'times text-red-600'}`)
                );
            }
            
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