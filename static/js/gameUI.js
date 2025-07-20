const GameUI = {
    currentQuestion: 0,
    timer: null,
    timeLeft: 30,  // Changed from 20 to 30
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

    // Add mute state
    isMuted: false,

    // Add new property to track countdown sound
    countdownSound: null,

    // Add property to track countdown duration
    countdownDuration: 5000, // 5 seconds in milliseconds
    countdownTimeout: null,

    // Get timer duration based on difficulty level
    getTimerDuration: function() {
        const difficulty = sessionStorage.getItem('selectedDifficulty') || 'medium';
        const timerMap = {
            'easy': 30,
            'medium': 45,
            'hard': 60
        };
        return timerMap[difficulty] || 45; // Default to medium (45 seconds)
    },

    // Initialize BGM settings
    initBgm: function() {
        this.bgm.loop = true;
        this.bgm.volume = 0;  // Start at 0 volume

        // Initialize mute button state
        const $muteBtn = $('#muteButton i');
        if (this.isMuted) {
            $muteBtn.removeClass('bi-volume-up').addClass('bi-volume-mute');
        } else {
            $muteBtn.removeClass('bi-volume-mute').addClass('bi-volume-up');
        }

        // Setup mute button handler with proper binding
        $('#muteButton').off('click').on('click', () => {
            this.toggleMute();
        });
    },

    toggleMute: function() {
        this.isMuted = !this.isMuted;
        const $muteBtn = $('#muteButton i');
        
        if (this.isMuted) {
            this.bgm.volume = 0;
            $muteBtn.removeClass('bi-volume-up').addClass('bi-volume-mute');
        } else {
            if (this.bgm.paused && this.currentQuestion < this.questions?.length) {
                this.bgm.play();
            }
            this.bgm.volume = this.bgmTargetVolume;
            $muteBtn.removeClass('bi-volume-mute').addClass('bi-volume-up');
        }

        // Store mute preference (optional)
        localStorage.setItem('gameIsMuted', this.isMuted);
    },

    fadeInBgm: function() {
        if (this.isMuted) return;
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
        
        // Get difficulty and prize from sessionStorage
        const difficulty = sessionStorage.getItem('selectedDifficulty') || 'medium';
        const prize = sessionStorage.getItem('selectedPrize') || 'Biscuit';
        
        // Update difficulty display if element exists
        const $difficultyDisplay = $('#difficultyLevel');
        if ($difficultyDisplay.length) {
            $difficultyDisplay.text(difficulty.toUpperCase());
            $difficultyDisplay.removeClass('text-green-600 text-yellow-600 text-red-600');
            if (difficulty === 'easy') {
                $difficultyDisplay.addClass('text-green-600');
            } else if (difficulty === 'medium') {
                $difficultyDisplay.addClass('text-yellow-600');
            } else {
                $difficultyDisplay.addClass('text-red-600');
            }
        }
        
        // Update prize display if element exists
        const $prizeDisplay = $('#prizeDisplay');
        if ($prizeDisplay.length) {
            const prizeEmojis = {'Candy': '🍭', 'Biscuit': '🍪', 'Keychain': '🔑'};
            const emoji = prizeEmojis[prize] || '🏆';
            $prizeDisplay.text(`${emoji} ${prize}`);
        }
        
        // Start background music with fade in
        this.initBgm();
        this.fadeInBgm();
        
        // Update total questions display
        $('#totalQuestions').text(this.questions.length);
        
        // Hide form and quiz container
        $('.bg-white.rounded-lg.shadow-md.mb-6').addClass('hidden');
        $('#quizContainer').addClass('hidden');
        
        // Show and reset game container elements
        $('#gameContainer').removeClass('hidden');
        $('#questionDisplay').removeClass('hidden');
        $('#scoreDisplay').removeClass('hidden');
        $('#finalResults').addClass('hidden');
        
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
        $('#timer').text(this.getTimerDuration());  // Use dynamic timer duration
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
                .addClass('answer-container')
                .append(
                    $('<button>')
                        .addClass('w-full py-4 px-6 text-white font-bold text-lg rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 answer-btn')
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
        const timerDuration = this.getTimerDuration();
        this.timeLeft = timerDuration;  // Use dynamic timer duration
        $('#timer').text(this.timeLeft);
        $('#timer, #timerProgress').removeClass('countdown-warning');
        
        // Reset BGM volume
        clearInterval(this.bgmFadeInterval);
        if (!this.isMuted) {
            this.bgm.volume = this.bgmTargetVolume;
        }
        
        // Reset progress bar state
        const $progressBar = $('#timerProgress');
        $progressBar.removeClass('timer-high timer-medium timer-low')
                   .addClass('timer-high');
        
        clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.timeLeft--;
            $('#timer').text(this.timeLeft);
            
            // Update timer progress bar
            const progressWidth = (this.timeLeft / timerDuration) * 100;  // Use dynamic timer duration
            $progressBar.css('width', `${progressWidth}%`);
            
            // Update color based on time remaining - scale with timer duration
            const lowThreshold = Math.ceil(timerDuration * 0.27); // ~27% of total time (8s for 30s, 12s for 45s, 16s for 60s)
            const mediumThreshold = Math.ceil(timerDuration * 0.5); // 50% of total time
            
            if (this.timeLeft <= lowThreshold) {
                $progressBar.removeClass('timer-medium').addClass('timer-low');
                // Only play sound if this is during an active question
                if (this.timeLeft === 5 && this.isNewQuestion) {  // Keep 5-second countdown regardless of total time
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
            } else if (this.timeLeft <= mediumThreshold) {
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
        // Clear countdown timeout if it exists
        if (this.countdownTimeout) {
            clearTimeout(this.countdownTimeout);
            this.countdownTimeout = null;
        }
        
        // Fade out countdown sound if it's playing
        if (this.countdownSound) {
            const fadeOut = setInterval(() => {
                if (this.countdownSound.volume > 0.1) {
                    this.countdownSound.volume -= 0.1;
                } else {
                    this.countdownSound.pause();
                    this.countdownSound = null;
                    clearInterval(fadeOut);
                }
            }, 50);
        }

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
                const timeBonus = this.timeLeft * 100;  // Bonus calculation remains same
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

        // Log analytics data
        this.logAnswerAnalytics({
            question_id: question.id,
            question_text: question.question,
            is_correct: isCorrect,
            time_taken: this.getTimerDuration() - this.timeLeft,  // Use dynamic timer duration
            score: isCorrect ? (1000 + (this.timeLeft * 100)) : 0
        });

        // Show answer feedback
        this.showAnswerFeedback(isCorrect, question.correct_answer, answer === null);
    },

    logAnswerAnalytics: async function(data) {
        try {
            await fetch('/api/analytics/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error logging analytics:', error);
        }
    },

    showAnswerFeedback: function(isCorrect, correctAnswer, timeOut = false) {
        $('.answer-btn').prop('disabled', true);
        
        if (timeOut) {          
            // Show "Time's up!" message with improved styling
            $('#questionText').append(
                $('<div>')
                    .addClass('times-up-message mt-6 text-center')
                    .html(`
                        <i class="bi bi-clock text-red-600 mb-3 text-4xl"></i>
                        <div class="text-2xl text-red-600 font-bold">Time's up!</div>
                    `)
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
        const finalMessage = this.getFinalMessage(this.correctAnswers);
        
        // Update final results display
        $('#finalScore').text(this.currentScore);
        $('#correctAnswers').text(this.correctAnswers);
        $('#bestStreak').text(this.bestStreak);
        
        // Update result message
        $('.p-4.md\\:p-8 h2, .p-6 h2').html(`
            <div class="mb-2">${finalMessage.title}</div>
            <div class="text-lg text-gray-500 font-normal">${finalMessage.subtitle}</div>
        `);
        
        $('#questionDisplay').addClass('hidden');
        $('#scoreDisplay').addClass('hidden');
        $('#finalResults').removeClass('hidden');

        // First fade out BGM completely
        const fadeOut = setInterval(() => {
            if (this.bgm.volume > 0.1) {
                this.bgm.volume -= 0.1;
            } else {
                this.bgm.pause();
                this.bgm.volume = 0.3; // Reset volume for next game
                clearInterval(fadeOut);
                
                if (!this.isMuted) {
                    const soundFile = (this.correctAnswers >= 3 && this.correctAnswers <= 5) 
                        ? 'you-won-a-prize.mp3' 
                        : 'you-won-nothing.mp3';
                    
                    console.log('Playing end game sound:', soundFile); // Debug log
                    
                    const resultsSound = new Audio(`/static/sounds/${soundFile}`);
                    resultsSound.volume = 1.0; // Ensure full volume
                    resultsSound.play().catch(err => {
                        console.error('Error playing sound:', err);
                    });
                }
            }
        }, 100);

        // Update Play Again button to redirect to home page
        $('#playAgain').off('click').on('click', () => {
            window.location.href = '/';
        });
    },

    getFinalMessage: function(correctCount) {
        const messages = {
            0: [
                { title: 'Game Over!', subtitle: 'Ready to try again? You got this! 🎮' },
                { title: 'Oops!', subtitle: 'Everyone starts somewhere. Keep going! 🌟' },
                { title: 'Not Quite There!', subtitle: 'Practice makes perfect! 💪' }
            ],
            1: [
                { title: 'Nice Try!', subtitle: 'One step at a time! 🎯' },
                { title: 'Getting Started!', subtitle: 'Room for improvement! 📈' },
                { title: 'Keep Going!', subtitle: 'You\'re on your way up! 🔝' }
            ],
            2: [
                { title: 'Almost There!', subtitle: 'So close to winning a prize! 🎲' },
                { title: 'Not Bad!', subtitle: 'Just a bit more practice! 🎯' },
                { title: 'Good Effort!', subtitle: 'You\'re getting better! 📈' }
            ],
            3: [
                { title: 'Good Job!', subtitle: 'You won a Prize! 🥇' },
                { title: 'Well Done!', subtitle: 'Bronze achievement unlocked! 🌟' },
                { title: 'Nice Work!', subtitle: 'You earned bronze! Keep it up! ⭐' }
            ],
            4: [
                { title: 'Excellent!', subtitle: 'You won a Prize! 🥈' },
                { title: 'Impressive!', subtitle: 'Silver achievement unlocked! ✨' },
                { title: 'Outstanding!', subtitle: 'Silver rank achieved! 🌟' }
            ],
            5: [
                { title: 'Perfect Score!', subtitle: 'You won a Prize! 🥇' },
                { title: 'Spectacular!', subtitle: 'Gold achievement unlocked! 🏆' },
                { title: 'Amazing!', subtitle: 'You\'re a trivia master! 👑' }
            ]
        };

        // Get message array for the score and pick a random one
        const messageArray = messages[correctCount] || messages[0];
        const randomIndex = Math.floor(Math.random() * messageArray.length);
        return messageArray[randomIndex];
    },

    playSound: function(type) {
        if (this.isMuted) return;
        
        const soundMap = {
            'success': 'success.mp3',
            'error': 'error.mp3',
            '5-second-countdown': '5-second-countdown.mp3'
        };

        // Special handling for countdown sound
        if (type === '5-second-countdown') {
            // Clear any existing countdown
            if (this.countdownTimeout) {
                clearTimeout(this.countdownTimeout);
            }
            if (this.countdownSound) {
                this.countdownSound.pause();
                this.countdownSound = null;
            }

            // Create and play new countdown sound
            this.countdownSound = new Audio(`/static/sounds/${soundMap[type]}`);
            this.countdownSound.play().catch(() => {});

            // Set timeout to cleanup after sound duration
            this.countdownTimeout = setTimeout(() => {
                if (this.countdownSound) {
                    this.countdownSound.pause();
                    this.countdownSound = null;
                }
            }, this.countdownDuration);
        } else {
            const audio = new Audio(`/static/sounds/${soundMap[type]}`);
            audio.play().catch(() => {});
        }
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
    // Load saved mute preference (optional)
    GameUI.isMuted = localStorage.getItem('gameIsMuted') === 'true';
    GameUI.initBgm();
});
