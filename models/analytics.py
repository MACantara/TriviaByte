from config.database import db
from datetime import datetime
from sqlalchemy import func

class QuestionAnalytics(db.Model):
    __tablename__ = "question_analytics"

    id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.id'))  # Changed from 'question.id' to 'questions.id'
    question_text = db.Column(db.String(500))
    correct_count = db.Column(db.Integer, default=0)
    wrong_count = db.Column(db.Integer, default=0)
    avg_time_taken = db.Column(db.Float, default=0)
    total_score = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @staticmethod
    def log_answer(question_id, question_text, is_correct, time_taken, score):
        analytics = QuestionAnalytics.query.filter_by(question_id=question_id).first()
        
        if not analytics:
            analytics = QuestionAnalytics(
                question_id=question_id,
                question_text=question_text,
                correct_count=0,
                wrong_count=0,
                avg_time_taken=0,
                total_score=0
            )
            db.session.add(analytics)

        if is_correct:
            analytics.correct_count += 1
        else:
            analytics.wrong_count += 1

        # Update average time taken
        total_attempts = analytics.correct_count + analytics.wrong_count
        analytics.avg_time_taken = ((analytics.avg_time_taken * (total_attempts - 1)) + time_taken) / total_attempts
        analytics.total_score += score

        db.session.commit()

    @staticmethod
    def get_all_analytics():
        analytics = QuestionAnalytics.query.all()
        total_attempts_across_all = sum(a.correct_count + a.wrong_count for a in analytics)
        
        return [{
            'question': item.question_text,
            'correct_answers': item.correct_count,
            'wrong_answers': item.wrong_count,
            'avg_time_taken': round(item.avg_time_taken, 2),
            'total_score': item.total_score,
            'accuracy': round((item.correct_count / (item.correct_count + item.wrong_count)) * 100, 1) if (item.correct_count + item.wrong_count) > 0 else 0,
            'difficulty': round((item.wrong_count / (item.correct_count + item.wrong_count)) * 100, 1) if (item.correct_count + item.wrong_count) > 0 else 50,
            'engagement': item.correct_count + item.wrong_count,  # Raw number of attempts for better sorting
            'engagement_rate': round((item.correct_count + item.wrong_count) / total_attempts_across_all * 100, 1) if total_attempts_across_all > 0 else 0,
            'created_at': item.created_at.isoformat()
        } for item in analytics]

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
