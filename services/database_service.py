from models.quiz import Question, db
from typing import List
import json

class DatabaseService:
    @staticmethod
    def store_single_question(question: str, options: List[str], correct_answer: str):
        """Store a single question in the database"""
        db_question = Question(
            question=question,
            options=options,
            correct_answer=correct_answer,
        )
        
        db.session.add(db_question)
        db.session.commit()
        return db_question

    @staticmethod
    def store_questions(questions: List[dict]):
        db_questions = []
        for q in questions:
            db_question = Question(
                question=q['question'],
                options=q['options'],
                correct_answer=q['correct_answer']
            )
            db_questions.append(db_question)
        
        db.session.add_all(db_questions)
        db.session.commit()
        return db_questions
