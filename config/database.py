import os
from flask_sqlalchemy import SQLAlchemy
import logging
from sqlalchemy import inspect

logger = logging.getLogger(__name__)
db = SQLAlchemy()

def init_db(app):
    """Initialize database without recreating existing tables."""
    db.init_app(app)
    with app.app_context():
        try:
            # Check if tables exist before creating
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
            
            if not existing_tables:
                logger.info("No tables found, creating initial schema...")
                db.create_all()
                logger.info("Database schema created successfully!")
            else:
                logger.info("Database tables already exist, skipping initialization")
                
        except Exception as e:
            logger.error(f"Error checking database: {e}")
            # Don't raise the error, just log it
            pass
