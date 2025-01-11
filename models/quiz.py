from sqlalchemy import Column, Integer, String, ARRAY, DateTime, Text
from sqlalchemy.sql import func
from config.database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    options = Column(ARRAY(String), nullable=False)
    correct_answer = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    topic = Column(String, nullable=False)
