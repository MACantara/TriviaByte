from flask import Blueprint, render_template, jsonify
from models.quiz import Question
from models.analytics import QuestionAnalytics

analytics = Blueprint('analytics', __name__)

@analytics.route('/analytics')
def index():
    return render_template('analytics/index.html')

@analytics.route('/api/analytics/questions')
def get_question_analytics():
    analytics_data = QuestionAnalytics.get_all_analytics()
    return jsonify(analytics_data)
