from flask import Blueprint, render_template, request, jsonify, current_app
from services.quiz_service import QuizService
from services.ai_service import AIService
from services.database_service import DatabaseService
from config.database import db
import logging

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
        num_questions = max(int(data.get('num_questions', 5)), 1)
        question_types = data.get('question_types', ['multiple_choice'])
        
        quiz = quiz_service.generate_quiz(
            num_questions=num_questions,
            question_types=question_types,
            topic=topic
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

@quiz_bp.route('/save-question', methods=['POST'])
def save_question():
    try:
        question_data = request.get_json()
        
        # Save single question
        saved_question = DatabaseService.store_single_question(
            question=question_data['question'],
            options=question_data['options'],
            correct_answer=question_data['correct_answer'],
        )

        return jsonify({
            'status': 'success',
            'message': 'Question saved successfully',
            'question_id': saved_question.id
        })

    except Exception as e:
        current_app.logger.error(f"Question save error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': "Failed to save question"
        }), 500
