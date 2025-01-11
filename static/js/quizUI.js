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
        $('#quizContainer').addClass('hidden');
        $('button[type="submit"]').prop('disabled', true).html(
            '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...'
        );
    },

    // Hide loading state
    hideLoading: function() {
        $('button[type="submit"]').prop('disabled', false).text('Generate Quiz');
    },

    // Display multiple choice question
    displayMultipleChoice: function(question, index, questionBody) {
        const shuffledOptions = this.shuffleArray(question.options);
        const mcOptions = $('<div>').addClass('space-y-2');
        shuffledOptions.forEach((option, optionIndex) => {
            mcOptions.append(`
                <div class="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                    <input class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
                           type="radio" 
                           name="q${index}" 
                           id="q${index}_${optionIndex}" 
                           value="${option}">
                    <label class="ml-2 block text-sm text-gray-700 cursor-pointer flex-grow" 
                           for="q${index}_${optionIndex}">${option}</label>
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
            const questionDiv = $('<div>').addClass('bg-white rounded-lg shadow p-6 mb-4');
            const questionBody = $('<div>');
            
            // Add question number header
            const questionHeader = $('<div>')
                .addClass('mb-4')
                .append(
                    $('<h3>')
                        .addClass('text-lg font-medium text-gray-900')
                        .text(`Question ${index + 1}`)
                );
            questionBody.append(questionHeader);
            
            questionBody.append($('<p>').addClass('text-gray-700 mb-4').text(question.question));
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
                .addClass('bg-blue-50 border-l-4 border-blue-400 p-4 mb-6')
                .html(`
                    <h4 class="text-lg font-medium text-blue-800">Quiz Results</h4>
                    <div class="mt-2">
                        <span class="text-4xl font-bold text-blue-600">${score}%</span>
                        <p class="text-sm text-blue-600">${correctCount} out of ${answers.length} correct</p>
                    </div>
                `)
        );

        // Display each question with results
        answers.forEach((answer, index) => {
            const questionDiv = $('<div>').addClass('bg-white rounded-lg shadow p-6 mb-4');
            const questionBody = $('<div>');
            
            // Question header with badge
            const badge = $('<span>')
                .addClass(`px-2 py-1 rounded-full text-sm ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`)
                .text(answer.isCorrect ? 'Correct' : 'Incorrect');
            
            questionBody.append(
                $('<div>')
                    .addClass('flex justify-between items-center mb-4')
                    .append(
                        $('<h3>').addClass('text-lg font-medium text-gray-900').text(`Question ${index + 1}`),
                        badge
                    )
            );

            // Question text
            questionBody.append($('<p>').addClass('text-gray-700 mb-4').text(answer.questionText));

            // Display answer options based on question type
            this.displayResultAnswers(answer, questionBody);

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add restart button
        questionsContainer.append(
            $('<button>')
                .addClass('mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2')
                .text('Start New Quiz')
                .on('click', () => {
                    $('#quizForm').trigger('reset');
                    $('#quizContainer').addClass('hidden');
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
        const answersSection = $('<div>').addClass('space-y-4');
        this.displayMCResult(answer, answersSection);
        
        // Add explanation immediately after answers
        if (answer.explanation) {
            const explanationSection = $('<div>')
                .addClass('mt-4 p-4 bg-gray-50 rounded-md border border-gray-200')
                .append(
                    $('<h6>').addClass('text-sm font-medium text-gray-900 mb-2').text('Explanation:'),
                    $('<p>').addClass('text-sm text-gray-700').text(answer.explanation)
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