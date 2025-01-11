from models.quiz import Question, db
from typing import List
import json

class DatabaseService:
    @staticmethod
    def store_single_question(question: str, options: List[str], correct_answer: str, topic: str):
        """Store a single question in the database"""
        db_question = Question(
            question=question,
            options=options,
            correct_answer=correct_answer,
            topic=topic
        )
        
        db.session.add(db_question)
        db.session.commit()
        return db_question

    @staticmethod
    def store_questions(questions: List[dict], topic: str):
        db_questions = []
        for q in questions:
            db_question = Question(
                question=q['question'],
                options=q['options'],
                correct_answer=q['correct_answer'],
                topic=topic
            )
            db_questions.append(db_question)
        
        db.session.add_all(db_questions)
        db.session.commit()
        return db_questions

    @staticmethod
    def get_questions_by_topic(topic: str):
        return Question.query.filter_by(topic=topic).all()
