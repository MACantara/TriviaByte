const AnalyticsUI = {
    data: [],

    init: function() {
        this.loadAnalyticsData();
        this.setupEventListeners();
    },

    setupEventListeners: function() {
        $('#sortBy').on('change', (e) => this.sortData(e.target.value));
        $('#refreshData').on('click', () => this.loadAnalyticsData());
    },

    async loadAnalyticsData() {
        try {
            $('#loadingState').removeClass('d-none');
            $('#analyticsTable, #noDataMessage').addClass('d-none');
            
            const response = await fetch('/analytics/api/questions');
            this.data = await response.json();
            
            if (this.data.length === 0) {
                $('#noDataMessage').removeClass('d-none');
                return;
            }

            this.displayData();
            $('#analyticsTable').removeClass('d-none');
        } catch (error) {
            console.error('Error loading analytics:', error);
            alert('Error loading analytics data. Please try again.');
        } finally {
            $('#loadingState').addClass('d-none');
        }
    },

    calculateSummaryStats() {
        const totalAnswers = this.data.reduce((sum, item) => sum + item.correct_answers + item.wrong_answers, 0);
        const totalCorrect = this.data.reduce((sum, item) => sum + item.correct_answers, 0);
        const avgAccuracy = (totalCorrect / totalAnswers * 100) || 0;
        const avgTime = this.data.reduce((sum, item) => sum + item.avg_time_taken, 0) / this.data.length;
        const totalScore = this.data.reduce((sum, item) => sum + item.total_score, 0);

        $('#totalAnswers').text(totalAnswers.toLocaleString());
        $('#avgAccuracy').text(avgAccuracy.toFixed(1) + '%');
        $('#avgTime').text(avgTime.toFixed(1) + 's');
        $('#totalScore').text(totalScore.toLocaleString());
    },

    displayData() {
        const tbody = document.querySelector('#analyticsTable tbody');
        tbody.innerHTML = '';
        
        const totalAttempts = this.data.reduce((max, item) => 
            Math.max(max, item.correct_answers + item.wrong_answers), 0);
        
        this.data.forEach(item => {
            const engagement = ((item.correct_answers + item.wrong_answers) / totalAttempts * 100).toFixed(1);
            const difficulty = (100 - item.accuracy).toFixed(1);
            
            tbody.innerHTML += `
                <tr>
                    <td>${item.question}</td>
                    <td class="text-center text-success fw-bold">${item.correct_answers}</td>
                    <td class="text-center text-danger fw-bold">${item.wrong_answers}</td>
                    <td class="text-center">${item.avg_time_taken.toFixed(1)}s</td>
                    <td class="text-center">${item.total_score.toLocaleString()}</td>
                    <td class="text-center">
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${this.getAccuracyClass(item.accuracy)}" 
                                 role="progressbar" 
                                 style="width: ${item.accuracy}%">
                                ${item.accuracy}%
                            </div>
                        </div>
                    </td>
                    <td class="text-center">${difficulty}%</td>
                    <td class="text-center">${engagement}%</td>
                </tr>
            `;
        });

        this.calculateSummaryStats();
        this.updateCharts();
    },

    getAccuracyClass(accuracy) {
        if (accuracy >= 80) return 'bg-success';
        if (accuracy >= 60) return 'bg-info';
        if (accuracy >= 40) return 'bg-warning';
        return 'bg-danger';
    },

    sortData(field) {
        this.data.sort((a, b) => b[field] - a[field]);
        this.displayData();
    },

    calculateTimeDistribution() {
        const timeRanges = [
            { min: 0, max: 5 },
            { min: 5, max: 10 },
            { min: 10, max: 15 },
            { min: 15, max: 20 }
        ];

        return timeRanges.map(range => {
            return this.data.reduce((count, item) => {
                const time = item.avg_time_taken;
                if (time >= range.min && time < range.max) {
                    return count + item.correct_answers + item.wrong_answers;
                }
                return count;
            }, 0);
        });
    },

    updateCharts() {
        // Time distribution chart
        const timeCtx = document.getElementById('timeChart').getContext('2d');
        new Chart(timeCtx, {
            type: 'bar',
            data: {
                labels: ['0-5s', '5-10s', '10-15s', '15-20s'],
                datasets: [{
                    label: 'Response Time Distribution',
                    data: this.calculateTimeDistribution(),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        // Accuracy vs Time chart
        const accuracyCtx = document.getElementById('accuracyTimeChart').getContext('2d');
        new Chart(accuracyCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Accuracy vs Time',
                    data: this.data.map(item => ({
                        x: item.avg_time_taken,
                        y: item.accuracy
                    })),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Average Time (seconds)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Accuracy (%)'
                        }
                    }
                }
            }
        });
    }
};

// Initialize when document is ready
$(document).ready(() => {
    AnalyticsUI.init();
});
