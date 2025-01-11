from flask import Blueprint, render_template, request, jsonify, current_app, session
from services.quiz_service import QuizService
from services.ai_service import AIService
from services.database_service import DatabaseService
from models.quiz import Question
from config.database import db
import logging
from sqlalchemy.sql import func
from routes.auth_routes import admin_required, login_required

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()
ai_service = AIService()

@quiz_bp.route('/')
def index():
    is_admin = session.get('is_admin', False)
    question_types = [
        {'id': 'multipleChoice', 'value': 'multiple_choice', 'label': 'Multiple Choice'}
    ]
    return render_template('index.html', question_types=question_types, is_admin=is_admin)

@quiz_bp.route('/generate', methods=['POST'])
@admin_required
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
@admin_required
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

@quiz_bp.route('/random-questions', methods=['GET'])
@login_required  # This decorator will now correctly redirect to /auth/login
def get_random_questions():
    try:
        # Get 5 random questions from the database
        random_questions = Question.query.order_by(func.random()).limit(5).all()
        
        questions = [{
            'id': q.id,
            'question': q.question,
            'options': q.options,
            'correct_answer': q.correct_answer,  # Add correct_answer field
            'type': 'multiple_choice',
            'created_at': q.created_at.isoformat()
        } for q in random_questions]

        return jsonify({
            'questions': questions,
            'status': 'success'
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching random questions: {str(e)}")
        return jsonify({
            'error': "Failed to fetch questions",
            'status': 'error'
        }), 500
