#!/usr/bin/env python3
"""
Database migration script to add difficulty field to existing questions
Run this after updating the Question model
"""

import sys
import os

# Add the project root directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from app import app
from models.quiz import db, Question
from sqlalchemy import text

def migrate_database():
    """Add difficulty field to existing questions and set default values"""
    with app.app_context():
        try:
            # Try to add the column if it doesn't exist
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE questions ADD COLUMN difficulty VARCHAR'))
                conn.commit()
            print("Added difficulty column to questions table")
        except Exception as e:
            if "already exists" in str(e) or "duplicate column" in str(e).lower():
                print("Difficulty column already exists")
            else:
                print(f"Error adding column: {e}")
        
        # Update existing questions without difficulty to have 'medium' difficulty
        try:
            result = db.session.execute(
                text("UPDATE questions SET difficulty = 'medium' WHERE difficulty IS NULL OR difficulty = ''")
            )
            db.session.commit()
            print(f"Updated {result.rowcount} questions to have medium difficulty")
        except Exception as e:
            print(f"Error updating questions: {e}")
            db.session.rollback()

if __name__ == "__main__":
    print("Running database migration...")
    migrate_database()
    print("Migration completed!")
