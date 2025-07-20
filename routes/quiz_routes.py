from flask import Blueprint, render_template, request, jsonify, current_app, session
from services.quiz_service import QuizService
from services.ai_service import AIService
from services.database_service import DatabaseService
from models.quiz import Question
from config.database import db
import logging
from sqlalchemy.sql import func
from routes.auth_routes import admin_required, login_required
from models.analytics import QuestionAnalytics

quiz_bp = Blueprint('quiz', __name__)
quiz_service = QuizService()
ai_service = AIService()

@quiz_bp.route('/')
def index():
    is_admin = session.get('is_admin', False)
    question_types = [
        {'id': 'multipleChoice', 'value': 'multiple_choice', 'label': 'Multiple Choice'}
    ]
    difficulty_levels = [
        {'id': 'easy', 'value': 'easy', 'label': 'Easy', 'prize': 'Candy'},
        {'id': 'medium', 'value': 'medium', 'label': 'Medium', 'prize': 'Biscuit'},
        {'id': 'hard', 'value': 'hard', 'label': 'Hard', 'prize': 'Keychain'}
    ]
    return render_template('index.html', question_types=question_types, 
                         difficulty_levels=difficulty_levels, is_admin=is_admin)

@quiz_bp.route('/play')
def play():
    """Route for level selection page"""
    difficulty_levels = [
        {'id': 'easy', 'value': 'easy', 'label': 'Easy', 'prize': 'Candy'},
        {'id': 'medium', 'value': 'medium', 'label': 'Medium', 'prize': 'Biscuit'},
        {'id': 'hard', 'value': 'hard', 'label': 'Hard', 'prize': 'Keychain'}
    ]
    return render_template('level_selection.html', difficulty_levels=difficulty_levels)

@quiz_bp.route('/generate', methods=['POST'])
@admin_required
def generate():
    try:
        data = request.get_json()
        topic = data.get('topic')
        num_questions = max(int(data.get('num_questions', 5)), 1)
        question_types = data.get('question_types', ['multiple_choice'])
        difficulty = data.get('difficulty', 'medium')
        
        quiz = quiz_service.generate_quiz(
            num_questions=num_questions,
            question_types=question_types,
            topic=topic,
            difficulty=difficulty
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
            difficulty=question_data.get('difficulty', 'medium')
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

@quiz_bp.route('/save-all-questions', methods=['POST'])
@admin_required
def save_all_questions():
    try:
        data = request.get_json()
        questions_data = data.get('questions', [])
        
        if not questions_data:
            return jsonify({
                'status': 'error',
                'message': 'No questions provided'
            }), 400
        
        saved_questions = []
        failed_questions = []
        
        for question_data in questions_data:
            try:
                # Save each question
                saved_question = DatabaseService.store_single_question(
                    question=question_data['question'],
                    options=question_data['options'],
                    correct_answer=question_data['correct_answer'],
                    difficulty=question_data.get('difficulty', 'medium')
                )
                saved_questions.append(saved_question.id)
            except Exception as e:
                current_app.logger.error(f"Failed to save question: {question_data.get('question', 'Unknown')}, Error: {str(e)}")
                failed_questions.append(question_data.get('question', 'Unknown question'))

        if failed_questions:
            return jsonify({
                'status': 'partial_success',
                'message': f'Saved {len(saved_questions)} questions successfully. Failed to save {len(failed_questions)} questions.',
                'saved_count': len(saved_questions),
                'failed_count': len(failed_questions),
                'failed_questions': failed_questions,
                'saved_question_ids': saved_questions
            }), 207  # Multi-status
        else:
            return jsonify({
                'status': 'success',
                'message': f'All {len(saved_questions)} questions saved successfully',
                'saved_count': len(saved_questions),
                'saved_question_ids': saved_questions
            })

    except Exception as e:
        current_app.logger.error(f"Save all questions error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': "Failed to save questions"
        }), 500

@quiz_bp.route('/random-questions', methods=['GET'])
def get_random_questions():  # Removed @login_required decorator
    try:
        difficulty = request.args.get('difficulty', 'medium')
        
        # Get 5 random questions from the database with specified difficulty
        random_questions = Question.query.filter_by(difficulty=difficulty).order_by(func.random()).limit(5).all()
        
        # If no questions for the specified difficulty, return error instead of fallback
        if not random_questions:
            # Check if there are any questions in the database at all
            total_questions = Question.query.count()
            if total_questions == 0:
                return jsonify({
                    'error': f"No questions available in the database. Please add some questions first.",
                    'status': 'error',
                    'difficulty_requested': difficulty
                }), 404
            else:
                # Get count of questions per difficulty for user information
                easy_count = Question.query.filter_by(difficulty='easy').count()
                medium_count = Question.query.filter_by(difficulty='medium').count()
                hard_count = Question.query.filter_by(difficulty='hard').count()
                
                return jsonify({
                    'error': f"No questions available for '{difficulty}' difficulty level.",
                    'status': 'error',
                    'difficulty_requested': difficulty,
                    'available_difficulties': {
                        'easy': easy_count,
                        'medium': medium_count,
                        'hard': hard_count
                    },
                    'suggestion': f"Try a different difficulty level with available questions."
                }), 404
        
        questions = [{
            'id': q.id,
            'question': q.question,
            'options': q.options,
            'correct_answer': q.correct_answer,
            'difficulty': q.difficulty,
            'type': 'multiple_choice',
            'created_at': q.created_at.isoformat()
        } for q in random_questions]

        return jsonify({
            'questions': questions,
            'status': 'success',
            'difficulty': difficulty,
            'count': len(questions)
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching random questions: {str(e)}")
        return jsonify({
            'error': "Failed to fetch questions",
            'status': 'error'
        }), 500

@quiz_bp.route('/api/analytics/log', methods=['POST'])
def log_analytics():
    try:
        data = request.get_json()
        
        QuestionAnalytics.log_answer(
            question_id=data['question_id'],
            question_text=data['question_text'],
            is_correct=data['is_correct'],
            time_taken=data['time_taken'],
            score=data['score']
        )
        
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
