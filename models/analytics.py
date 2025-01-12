from config.database import db
from datetime import datetime
from sqlalchemy import func
import math

class QuestionAnalytics(db.Model):
    __tablename__ = "question_analytics"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))  # Changed from 'question.id' to 'questions.id'
    question_text = db.Column(db.String(500))
    correct_count = db.Column(db.Integer, default=0)
    wrong_count = db.Column(db.Integer, default=0)
    timeout_count = db.Column(db.Integer, default=0)  # Add new column for timeouts
    avg_time_taken = db.Column(db.Float, default=0)
    total_score = db.Column(db.Integer, default=0)
    option_distribution = db.Column(db.JSON)  # Add new column for answer distribution
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def log_answer(question_id, question_text, is_correct, time_taken, score, is_timeout=False, selected_option=None):
        analytics = QuestionAnalytics.query.filter_by(question_id=question_id).first()
        
        if not analytics:
            analytics = QuestionAnalytics(
                question_id=question_id,
                question_text=question_text,
                correct_count=0,
                wrong_count=0,
                timeout_count=0,
                avg_time_taken=0,
                total_score=0,
                option_distribution={}
            )
            db.session.add(analytics)

        # Update answer distribution
        if selected_option:
            distribution = analytics.option_distribution or {}
            distribution[selected_option] = distribution.get(selected_option, 0) + 1
            analytics.option_distribution = distribution

        if is_timeout:
            analytics.timeout_count += 1
        elif is_correct:
            analytics.correct_count += 1
        else:
            analytics.wrong_count += 1

        # Update average time taken
        total_attempts = analytics.correct_count + analytics.wrong_count + analytics.timeout_count
        analytics.avg_time_taken = ((analytics.avg_time_taken * (total_attempts - 1)) + time_taken) / total_attempts
        analytics.total_score += score

        db.session.commit()

    @staticmethod
    def get_all_analytics():
        analytics = QuestionAnalytics.query.all()
        total_questions = QuestionAnalytics.query.count()
        
        return [{
            'question': item.question_text,
            'correct_answers': item.correct_count,
            'wrong_answers': item.wrong_count,
            'timeouts': item.timeout_count,
            'avg_time_taken': round(item.avg_time_taken, 2),
            'total_score': item.total_score,
            'accuracy': calculate_accuracy(item),
            'difficulty': calculate_difficulty(item),
            'engagement': calculate_engagement(item, total_questions),
            'option_distribution': item.option_distribution or {},
            'created_at': item.created_at.isoformat()
        } for item in analytics]

def calculate_accuracy(item):
    total_attempts = item.correct_count + item.wrong_count + item.timeout_count
    if total_attempts == 0:
        return 0
    return round((item.correct_count / total_attempts) * 100, 1)

def calculate_difficulty(item):
    if item.correct_count + item.wrong_count + item.timeout_count == 0:
        return 50  # Default medium difficulty

    # Factors that increase difficulty:
    # 1. High wrong answer rate
    # 2. High timeout rate
    # 3. Longer average time taken
    wrong_rate = item.wrong_count / (item.correct_count + item.wrong_count + item.timeout_count)
    timeout_rate = item.timeout_count / (item.correct_count + item.wrong_count + item.timeout_count)
    time_factor = min(item.avg_time_taken / 20, 1)  # Normalized to 0-1

    # Combined difficulty score (0-100)
    difficulty = (
        (wrong_rate * 0.4) +        # 40% weight to wrong answers
        (timeout_rate * 0.3) +      # 30% weight to timeouts
        (time_factor * 0.3)         # 30% weight to time taken
    ) * 100

    return round(difficulty, 1)

def calculate_engagement(item, total_questions):
    if not item.option_distribution or total_questions == 0:
        return 0

    total_attempts = item.correct_count + item.wrong_count + item.timeout_count
    if total_attempts == 0:
        return 0

    # Factors that indicate engagement:
    # 1. Answer distribution evenness
    # 2. Response rate
    # 3. Quick response time bonus

    # Calculate distribution evenness (0-1)
    values = list(item.option_distribution.values())
    max_value = max(values)
    distribution_evenness = sum(v/max_value for v in values) / len(values)

    # Calculate response rate (0-1)
    response_rate = total_attempts / total_questions

    # Time bonus (0-1): quicker average times mean more engagement
    time_bonus = max(0, 1 - (item.avg_time_taken / 20))

    # Combined engagement score (0-100)
    engagement = (
        (distribution_evenness * 0.3) +  # 30% weight to answer distribution
        (response_rate * 0.5) +          # 50% weight to response rate
        (time_bonus * 0.2)               # 20% weight to time bonus
    ) * 100

    return round(engagement, 1)

    @staticmethod
    def get_summary_stats():
        try:
            result = db.session.query(
                func.sum(QuestionAnalytics.correct_count).label('total_correct'),
                func.sum(QuestionAnalytics.wrong_count).label('total_wrong'),
                func.avg(QuestionAnalytics.avg_time_taken).label('avg_time'),
                func.sum(QuestionAnalytics.total_score).label('total_score')
            ).first()
            
            total_attempts = (result.total_correct or 0) + (result.total_wrong or 0)
            
            return {
                'total_attempts': total_attempts,
                'average_accuracy': round((result.total_correct / total_attempts * 100), 1) if total_attempts > 0 else 0,
                'average_time': round(result.avg_time or 0, 2),
                'total_score': result.total_score or 0
            }
        except Exception as e:
            current_app.logger.error(f"Error calculating summary stats: {str(e)}")
            return {
                'total_attempts': 0,
                'average_accuracy': 0,
                'average_time': 0,
                'total_score': 0
            }
