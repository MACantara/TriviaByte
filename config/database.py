import os
from flask_sqlalchemy import SQLAlchemy
import logging

logger = logging.getLogger(__name__)
db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        try:
            logger.info("Creating tables if they don't exist...")
            db.create_all()  # Only create tables that don't exist
            logger.info("Database initialized successfully!")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
