import os
from flask_sqlalchemy import SQLAlchemy
import logging

logger = logging.getLogger(__name__)
db = SQLAlchemy()

def init_db(app):
    db.init_app(app)
    with app.app_context():
        try:
            logger.info("Dropping all tables...")
            db.drop_all()  # This will drop all existing tables
            logger.info("Creating all tables...")
            db.create_all()  # This will create tables with current schema
            logger.info("Database initialized successfully!")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise
