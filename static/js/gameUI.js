const GameUI = {
    currentQuestion: 0,
    timer: null,
    timeLeft: 20,
    currentScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    correctAnswers: 0,
    isNewQuestion: false,
    
    colors: ['#e21b3c', '#1368ce', '#d89e00', '#26890c'],
    
    // Add new properties for audio
    bgm: new Audio('/static/sounds/bgm.mp3'),
    
    // Add fade properties
    bgmTargetVolume: 0.3,
    bgmFadeInterval: null,

    // Initialize BGM settings
    initBgm: function() {
        this.bgm.loop = true;
        this.bgm.volume = 0;  // Start at 0 volume
    },

    fadeInBgm: function() {
        clearInterval(this.bgmFadeInterval);
        this.bgm.volume = 0;
        this.bgm.play().catch(() => console.log('BGM autoplay prevented'));
        
        this.bgmFadeInterval = setInterval(() => {
            if (this.bgm.volume < this.bgmTargetVolume) {
                this.bgm.volume = Math.min(this.bgmTargetVolume, this.bgm.volume + 0.02);
            } else {
                clearInterval(this.bgmFadeInterval);
            }
        }, 100);
    },

    startGame: function(questions) {
        this.resetGame();
        this.questions = questions;
        
        // Start background music with fade in
        this.initBgm();
        this.fadeInBgm();
        
        // Update total questions display
        $('#totalQuestions').text(this.questions.length);
        
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
        // Stop background music
        this.bgm.pause();
        this.bgm.currentTime = 0;
        
        this.currentQuestion = 0;
        this.currentScore = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.correctAnswers = 0;
        
        // Reset displays
        $('#currentScore').text('0');
        $('#currentStreak').text('0');
        $('#currentQuestionNum').text('1');
        $('#timerProgress').css('width', '100%');
        $('#timer').text('20');
        $('#questionText').empty();
        $('#answerGrid').empty();
    },

    showQuestion: function() {
        if (this.currentQuestion >= this.questions.length) {
            this.endGame();
            return;
        }

        this.isNewQuestion = true;  // Set flag when showing new question

        const question = this.questions[this.currentQuestion];
        
        // Update question counter
        $('#currentQuestionNum').text(this.currentQuestion + 1);
        
        // Reset timer progress bar
        $('#timerProgress').css('width', '100%');
        
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
        $('#timer, #timerProgress').removeClass('countdown-warning');
        
        // Reset BGM volume
        clearInterval(this.bgmFadeInterval);
        this.bgm.volume = this.bgmTargetVolume;
        
        // Reset progress bar state
        const $progressBar = $('#timerProgress');
        $progressBar.removeClass('timer-high timer-medium timer-low')
                   .addClass('timer-high');
        
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            $('#timer').text(this.timeLeft);
            
            // Update timer progress bar
            const progressWidth = (this.timeLeft / 20) * 100;
            $progressBar.css('width', `${progressWidth}%`);
            
            // Update color based on time remaining
            if (this.timeLeft <= 5) {
                $progressBar.removeClass('timer-medium').addClass('timer-low');
                // Only play sound if this is during an active question
                if (this.timeLeft === 5 && this.isNewQuestion) {
                    this.playSound('5-second-countdown');
                    $('#timer, #timerProgress').addClass('countdown-warning');
                    
                    // Start fading out BGM but maintain minimal volume
                    const fadeInterval = setInterval(() => {
                        if (this.bgm.volume > 0.1) {  // Changed from 0.05 to 0.1
                            this.bgm.volume = Math.max(0.1, this.bgm.volume - 0.04);  // Slower fade, stop at 0.1
                        } else {
                            clearInterval(fadeInterval);
                        }
                    }, 200);
                }
            } else if (this.timeLeft <= 10) {
                $progressBar.removeClass('timer-high').addClass('timer-medium');
            }
            
            if (this.timeLeft <= 0) {
                this.isNewQuestion = false;  // Reset flag when time's up
                $('#timer, #timerProgress').removeClass('countdown-warning');
                this.handleAnswer(null);
            }
        }, 1000);
    },

    handleAnswer: function(answer) {
        this.isNewQuestion = false;  // Reset flag when answer is given
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
        // Fade out and stop background music
        const fadeOut = setInterval(() => {
            if (this.bgm.volume > 0.1) {
                this.bgm.volume -= 0.1;
            } else {
                this.bgm.pause();
                this.bgm.volume = 0.3; // Reset volume for next game
                clearInterval(fadeOut);
            }
        }, 100);

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
        const soundMap = {
            'success': 'success.mp3',
            'error': 'error.mp3',
            '5-second-countdown': '5-second-countdown.mp3'
        };
        const audio = new Audio(`/static/sounds/${soundMap[type]}`);
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

// Initialize GameUI when document is ready
$(document).ready(() => {
    GameUI.initBgm();
});
