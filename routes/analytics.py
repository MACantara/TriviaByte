from flask import Blueprint, render_template, jsonify, current_app
from models.quiz import Question
from models.analytics import QuestionAnalytics
from functools import wraps
from flask import session, redirect, url_for

analytics_bp = Blueprint('analytics', __name__)

def admin_required(f):
    """Decorator to require admin access for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('is_admin'):
            current_app.logger.warning(f"Unauthorized access attempt to analytics by {session.get('user_id')}")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

@analytics_bp.route('/')
@admin_required
def index():
    """Render analytics dashboard"""
    try:
        return render_template('analytics/index.html')
    except Exception as e:
        current_app.logger.error(f"Error rendering analytics dashboard: {str(e)}")
        return render_template('error.html', message="Error loading analytics dashboard"), 500

@analytics_bp.route('/api/questions')
@admin_required
def get_question_analytics():
    """Get analytics data for all questions"""
    try:
        analytics_data = QuestionAnalytics.get_all_analytics()
        
        # Add summary statistics
        summary_stats = QuestionAnalytics.get_summary_stats()
        
        return jsonify({
            'status': 'success',
            'data': {
                'questions': analytics_data,
                'summary': summary_stats,
                'meta': {
                    'total_questions': len(analytics_data),
                    'generated_at': datetime.now().isoformat()
                }
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching analytics data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': 'Failed to fetch analytics data',
            'error': str(e)
        }), 500

@analytics_bp.route('/api/questions/<int:question_id>')
@admin_required
def get_question_detail(question_id):
    """Get detailed analytics for a specific question"""
    try:
        question = Question.query.get_or_404(question_id)
        analytics = QuestionAnalytics.query.filter_by(question_id=question_id).first_or_404()
        
        return jsonify({
            'status': 'success',
            'data': {
                'question': question.question,
                'analytics': {
                    'correct_count': analytics.correct_count,
                    'wrong_count': analytics.wrong_count,
                    'timeout_count': analytics.timeout_count,
                    'avg_time_taken': round(analytics.avg_time_taken, 2),
                    'total_score': analytics.total_score,
                    'option_distribution': analytics.option_distribution,
                    'difficulty_score': calculate_difficulty(analytics),
                    'engagement_score': calculate_engagement(analytics, Question.query.count()),
                    'accuracy': calculate_accuracy(analytics)
                },
                'meta': {
                    'created_at': analytics.created_at.isoformat(),
                    'last_attempt': max(analytics.correct_count + analytics.wrong_count + analytics.timeout_count, 0)
                }
            }
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching question analytics for ID {question_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': f'Failed to fetch analytics for question {question_id}',
            'error': str(e)
        }), 500

@analytics_bp.errorhandler(404)
def not_found_error(error):
    """Handle 404 errors"""
    return jsonify({
        'status': 'error',
        'message': 'Resource not found'
    }), 404
