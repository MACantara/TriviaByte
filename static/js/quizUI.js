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
            '<span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span> Generating...'
        );
    },

    // Hide loading state
    hideLoading: function() {
        $('button[type="submit"]').prop('disabled', false).text('Generate Quiz');
    },

    // Display multiple choice question
    displayMultipleChoice: function(question, index, questionBody) {
        const shuffledOptions = this.shuffleArray(question.options);
        const mcOptions = $('<div>').addClass('space-y-3');
        shuffledOptions.forEach((option, optionIndex) => {
            mcOptions.append(`
                <div class="flex items-center">
                    <input class="mr-3 text-blue-600" type="radio" name="q${index}" id="q${index}_${optionIndex}" value="${option}">
                    <label class="flex-1 py-3 px-4 bg-gray-100 rounded-lg font-medium cursor-pointer hover:bg-gray-200 transition-colors" for="q${index}_${optionIndex}">${option}</label>
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
            const questionDiv = $('<div>').addClass('bg-white rounded-lg shadow-sm mb-6');
            const questionBody = $('<div>').addClass('p-6');
            
            // Add question header with save button
            const headerDiv = $('<div>').addClass('flex justify-between items-center mb-6');
            headerDiv.append(
                $('<h5>').addClass('text-lg font-bold').text(`Question ${index + 1}`),
                $('<button>')
                    .addClass('bg-blue-100 text-blue-600 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-200 transition-colors')
                    .attr('data-question-index', index)
                    .html('<i class="fas fa-save mr-2"></i>Save')
                    .on('click', () => this.handleSaveQuestion(question))
            );
            questionBody.append(headerDiv);
            
            questionBody.append($('<p>').addClass('text-gray-800 mb-6').text(question.question));
            this.displayMultipleChoice(question, index, questionBody);

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add submit button
        questionsContainer.append(`
            <button id="submitQuiz" class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg shadow-sm text-lg font-medium hover:bg-blue-700 transition-colors">
                <i class="fas fa-check-circle mr-2"></i>Submit Answers
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
            <div class="bg-white rounded-lg shadow-sm mb-6">
                <div class="p-6 text-center">
                    <h3 class="text-2xl font-bold mb-4">Quiz Results</h3>
                    <div class="text-5xl text-blue-600 font-bold mb-2">${score}%</div>
                    <div class="text-gray-600">${correctCount} out of ${answers.length} correct</div>
                </div>
            </div>
        `);

        // Display each question with results
        answers.forEach((answer, index) => {
            const questionDiv = $('<div>').addClass('bg-white rounded-lg shadow-sm mb-4');
            const questionBody = $('<div>').addClass('p-6');
            
            // Question header with badge
            const badge = $('<span>')
                .addClass(`inline-block px-3 py-1 rounded-full text-sm font-medium ${answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`)
                .text(answer.isCorrect ? 'Correct' : 'Incorrect');
            
            questionBody.append(
                $('<div>')
                    .addClass('flex justify-between items-center mb-4')
                    .append(
                        $('<h5>').addClass('text-lg font-bold').text(`Question ${index + 1}`),
                        badge
                    )
            );

            // Question text
            questionBody.append($('<p>').addClass('text-gray-800 mb-4').text(answer.questionText));

            // Display answer options based on question type
            this.displayResultAnswers(answer, questionBody);

            questionDiv.append(questionBody);
            questionsContainer.append(questionDiv);
        });

        // Add restart button
        questionsContainer.append(
            $('<button>')
                .addClass('w-full bg-blue-600 text-white py-3 px-6 rounded-lg shadow-sm text-lg font-medium hover:bg-blue-700 transition-colors mt-6')
                .html('<i class="fas fa-redo mr-2"></i>Start New Quiz')
                .on('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                        $('#quizForm').trigger('reset');
                        $('#quizContainer').addClass('hidden');
                        $('.bg-white.rounded-lg.shadow-md.mb-6').removeClass('hidden');
                    }, 300);
                })
        );
    },

    displayResultAnswers: function(answer, container) {
        const answersSection = $('<div>').addClass('mb-4');
        this.displayMCResult(answer, answersSection);
        container.append(answersSection);
    },

    displayMCResult: function(answer, container) {
        const options = answer.options;
        
        options.forEach(option => {
            const isUserAnswer = String(answer.userAnswer).toLowerCase() === String(option).toLowerCase();
            const isCorrectAnswer = String(answer.correctAnswer).toLowerCase() === String(option).toLowerCase();
            
            let optionClasses = 'flex items-center mb-2 p-3 rounded-lg';
            
            if (isCorrectAnswer) {
                optionClasses += ' bg-green-50';
            }
            
            if (isUserAnswer) {
                optionClasses += isCorrectAnswer ? ' border-2 border-green-500' : ' border-2 border-red-500';
            }
            
            const optionDiv = $('<div>').addClass(optionClasses);
            
            optionDiv.append(
                $('<div>').addClass('flex items-center flex-1').append(
                    $('<input>')
                        .addClass('mr-3 text-blue-600')
                        .attr({
                            type: 'radio',
                            disabled: true,
                            checked: isUserAnswer
                        }),
                    $('<label>')
                        .addClass('flex-1 cursor-default')
                        .text(option),
                    isUserAnswer && $('<i>')
                        .addClass(`fas fa-${isCorrectAnswer ? 'check text-green-600' : 'times text-red-600'} ml-2`)
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