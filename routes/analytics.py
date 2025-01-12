from flask import Blueprint, render_template, jsonify
from flask import current_app
from models.quiz import Question
from models.analytics import QuestionAnalytics
from functools import wraps
from flask import session, redirect, url_for

analytics_bp = Blueprint('analytics', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@analytics_bp.route('/')
@admin_required
def index():
    return render_template('analytics/index.html')

@analytics_bp.route('/api/questions')
@admin_required
def get_question_analytics():
    try:
        analytics_data = QuestionAnalytics.get_all_analytics()
        return jsonify(analytics_data)
    except Exception as e:
        current_app.logger.error(f"Error fetching analytics: {str(e)}")
        return jsonify({'error': 'Failed to fetch analytics data'}), 500
