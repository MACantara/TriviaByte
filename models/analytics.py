from config.database import db
from datetime import datetime

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
        return [{
            'question': item.question_text,
            'correct_answers': item.correct_count,
            'wrong_answers': item.wrong_count,
            'avg_time_taken': round(item.avg_time_taken, 2),
            'total_score': item.total_score,
            'accuracy': round((item.correct_count / (item.correct_count + item.wrong_count)) * 100, 1) if (item.correct_count + item.wrong_count) > 0 else 0
        } for item in analytics]
