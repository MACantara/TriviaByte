from sqlalchemy.orm import Session
from models.quiz import Question
from typing import List
import json

class DatabaseService:
    @staticmethod
    def store_questions(db: Session, questions: List[dict], topic: str):
        db_questions = []
        for q in questions:
            db_question = Question(
                question=q['question'],
                options=q['options'],
                correct_answer=q['correct_answer'],
                topic=topic
            )
            db_questions.append(db_question)
        
        db.add_all(db_questions)
        db.commit()
        return db_questions

    @staticmethod
    def get_questions_by_topic(db: Session, topic: str):
        return db.query(Question).filter(Question.topic == topic).all()
