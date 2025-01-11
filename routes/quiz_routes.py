from flask import Blueprint, render_template, request, jsonify, current_app
import time
from services.quiz_service import QuizService
from services.ai_service import AIService
from config.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()
ai_service = AIService()

@quiz_bp.route('/')
def index():
    question_types = [
        {'id': 'multipleChoice', 'value': 'multiple_choice', 'label': 'Multiple Choice'}
    ]
    return render_template('index.html', question_types=question_types)

@quiz_bp.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.get_json()
        topic = data.get('topic')
        num_questions = max(int(data.get('num_questions', 5)), 1)  # Remove upper limit, keep minimum of 1
        question_types = data.get('question_types', ['multiple_choice'])

        # Get database session
        db = next(get_db())
        
        quiz = quiz_service.generate_quiz(
            topic=topic,
            num_questions=num_questions,
            question_types=question_types,
            db=db
        )

        return jsonify({
            'quiz': quiz,
            'status': 'success'
        })

    except Exception as e:
        current_app.logger.error(f"Quiz generation error: {str(e)}")
        return jsonify({
            'error': "Failed to generate quiz",
            'status': 'error'
        }), 500
