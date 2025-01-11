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
        $('#quizContainer').addClass('d-none');
        $('#gameContainer').removeClass('d-none');
        this.showQuestion();
    },

    resetGame: function() {
        this.currentQuestion = 0;
        this.currentScore = 0;
        this.currentStreak = 0;
        this.bestStreak = 0;
        this.correctAnswers = 0;
        $('#currentScore').text('0');
        $('#currentStreak').text('0');
        $('#scoreDisplay').removeClass('d-none');
        $('#finalResults').addClass('d-none');
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
        const question = this.questions[this.currentQuestion];
        const isCorrect = answer === question.correct_answer;
        
        if (isCorrect) {
            const timeBonus = this.timeLeft * 100;
            const points = 1000 + timeBonus;
            this.currentScore += points;
            this.correctAnswers++;
            this.currentStreak++;
            this.bestStreak = Math.max(this.bestStreak, this.currentStreak);
            
            // Play success sound
            this.playSound('success');
        } else {
            this.currentStreak = 0;
            // Play error sound
            this.playSound('error');
        }

        // Update score display
        $('#currentScore').text(this.currentScore);
        $('#currentStreak').text(this.currentStreak);

        // Show answer feedback
        this.showAnswerFeedback(isCorrect, question.correct_answer);
    },

    showAnswerFeedback: function(isCorrect, correctAnswer) {
        $('.answer-btn').prop('disabled', true);
        
        // Highlight correct and wrong answers
        $('.answer-btn').each(function() {
            const btn = $(this);
            if (btn.text() === correctAnswer) {
                btn.addClass('correct-answer');
            }
        });

        // Wait and show next question
        setTimeout(() => {
            this.currentQuestion++;
            this.showQuestion();
        }, 2000);
    },

    endGame: function() {
        $('#finalScore').text(this.currentScore);
        $('#correctAnswers').text(this.correctAnswers);
        $('#bestStreak').text(this.bestStreak);
        $('#questionDisplay').addClass('d-none');
        $('#scoreDisplay').addClass('d-none');
        $('#finalResults').removeClass('d-none');
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
