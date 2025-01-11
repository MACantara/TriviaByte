const GameUI = {
    currentQuestion: 0,
    timer: null,
    timeLeft: 20,
    currentScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    correctAnswers: 0,
    
    colors: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'],
    
    startGame: function(questions) {
        this.resetGame();
        this.questions = questions;
        
        // Hide form and quiz container
        $('.card.mb-4').addClass('d-none');
        $('#quizContainer').addClass('d-none');
        
        // Show and reset game container elements
        $('#gameContainer').removeClass('d-none');
        $('#questionDisplay').removeClass('d-none');
        $('#scoreDisplay').removeClass('d-none');
        $('#finalResults').addClass('d-none');
        
        this.showQuestion();
    },

    resetGame: function() {
        this.currentQuestion = 0;
        this.currentScore = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.correctAnswers = 0;
        
        // Reset displays
        $('#currentScore').text('0');
        $('#currentStreak').text('0');
        $('#questionProgress').css('width', '0%');
        $('#timer').text('20');
        $('#questionText').empty();
        $('#answerGrid').empty();
    },

    showQuestion: function() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }

        const question = this.questions[this.currentQuestion];
        const progress = ((this.currentQuestion + 1) / this.questions.length) * 100;
        
        // Update progress bar
        $('#questionProgress').css('width', `${progress}%`);
        
        // Show question
        $('#questionText').text(question.question);
        
        // Create answer grid
        const answerGrid = $('#answerGrid').empty();
        
        // Shuffle and display options with animations
        this.shuffleArray(question.options).forEach((option, index) => {
            const button = $('<div>')
                .addClass('col-md-6')
                .append(
                    $('<button>')
                        .addClass('btn btn-lg w-100 h-100 py-4 answer-btn')
                        .css('background-color', this.colors[index])
                        .css('transform', 'scale(0)')
                        .text(option)
                        .on('click', () => this.handleAnswer(option))
                );
            answerGrid.append(button);
        });

        // Animate buttons appearing
        $('.answer-btn').each((i, btn) => {
            setTimeout(() => {
                $(btn).css('transform', 'scale(1)');
            }, i * 100);
        });

        // Start timer
        this.startTimer();
    },

    startTimer: function() {
        this.timeLeft = 20;
        $('#timer').text(this.timeLeft);
        
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            $('#timer').text(this.timeLeft);
            
            if (this.timeLeft <= 0) {
                this.handleAnswer(null);
            }
        }, 1000);
    },

    handleAnswer: function(answer) {
        clearInterval(this.timer);
        
        // Remove previous selections and handle no answer case
        $('.answer-btn').removeClass('selected');
        
        if (answer !== null) {
            // Add selected class to clicked button
            $('.answer-btn').each(function() {
                if ($(this).text() === answer) {
                    $(this).addClass('selected');
                }
            });
        }

        const question = this.questions[this.currentQuestion];
        const isCorrect = answer === question.correct_answer;
        
        // Only update score if an answer was given
        if (answer !== null) {
            if (isCorrect) {
                const timeBonus = this.timeLeft * 100;
                const points = 1000 + timeBonus;
                this.currentScore += points;
                this.correctAnswers++;
                this.currentStreak++;
                this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
                
                // Delay sound to match animation
                setTimeout(() => this.playSound('success'), 600);
            } else {
                this.currentStreak = 0;
                // Delay sound to match animation
                setTimeout(() => this.playSound('error'), 600);
            }
            
            // Update score display
            $('#currentScore').text(this.currentScore);
            $('#currentStreak').text(this.currentStreak);
        }

        // Show answer feedback
        this.showAnswerFeedback(isCorrect, question.correct_answer, answer === null);
    },

    showAnswerFeedback: function(isCorrect, correctAnswer, timeOut = false) {
        $('.answer-btn').prop('disabled', true);
        
        if (timeOut) {
            // Show "Time's up!" message immediately
            $('#questionText').append(
                $('<div>')
                    .addClass('text-danger mt-3')
                    .text("Time's up!")
            );

            // Then start the answer feedback sequence
            setTimeout(() => {
                // Gray out all answers first
                $('.answer-btn').each(function() {
                    $(this).animate({
                        backgroundColor: 'rgba(128, 128, 128, 0.8)'
                    }, 300);
                });

                // Show correct answer after graying out
                setTimeout(() => {
                    $('.answer-btn').each(function() {
                        if ($(this).text() === correctAnswer) {
                            $(this).animate({
                                backgroundColor: 'rgba(40, 167, 69, 1)'
                            }, 500).addClass('correct-answer');
                        }
                    });
                }, 600);
            }, 300);  // Short delay after "Time's up!" message
        } else {
            // Gray out non-selected answers with proper opacity
            $('.answer-btn').not('.selected').each(function() {
                $(this).animate({
                    backgroundColor: 'rgba(128, 128, 128, 0.8)'
                }, 300);
            });

            // After graying out others, show correct/wrong feedback
            setTimeout(() => {
                $('.answer-btn.selected').each(function() {
                    const btn = $(this);
                    if (btn.text() === correctAnswer) {
                        // Correct answer - transition to green
                        btn.animate({
                            backgroundColor: 'rgba(40, 167, 69, 1)'  // Solid green
                        }, 500).addClass('correct-answer');
                    } else {
                        // Wrong answer - transition to red
                        btn.animate({
                            backgroundColor: 'rgba(220, 53, 69, 1)'  // Solid red
                        }, 500).addClass('wrong-answer');
                        
                        // Show correct answer in green
                        $('.answer-btn').each(function() {
                            if ($(this).text() === correctAnswer) {
                                $(this).delay(200).animate({
                                    backgroundColor: 'rgba(40, 167, 69, 1)'  // Solid green
                                }, 500).addClass('correct-answer');
                            }
                        });
                    }
                });
            }, 600);
        }

        // Move to next question after animations
        setTimeout(() => {
            this.currentQuestion++;
            this.showQuestion();
        }, 2000);  // Consistent timing for both timeout and normal cases
    },

    endGame: function() {
        $('#finalScore').text(this.currentScore);
        $('#correctAnswers').text(this.correctAnswers);
        $('#bestStreak').text(this.bestStreak);
        $('#questionDisplay').addClass('d-none');
        $('#scoreDisplay').addClass('d-none');
        $('#finalResults').removeClass('d-none');

        // Update Play Again button to return to index
        $('#playAgain').off('click').on('click', () => {
            $('#gameContainer').addClass('d-none');
            $('.card.mb-4').removeClass('d-none');  // Show quiz form
            this.resetGame();
        });
    },

    playSound: function(type) {
        const audio = new Audio(`/static/sounds/${type}.mp3`);
        audio.play().catch(() => {});
    },

    shuffleArray: function(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
};
