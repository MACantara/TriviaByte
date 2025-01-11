import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.absolute())
sys.path.insert(0, project_root)

from dotenv import load_dotenv
from config.database import db
from models.user import User
from models.quiz import Question
from models.analytics import QuestionAnalytics
from flask import Flask
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    load_dotenv()
    
    # Configure database
    db_url = os.getenv('POSTGRES_URL_NON_POOLING')
    if not db_url:
        raise ValueError("Database URL not found in environment variables")
    
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace('postgres://', 'postgresql://')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    return app

def init_db():
    try:
        app = create_app()
        
        with app.app_context():
            logger.info("Creating database tables...")
            
            # Create tables in correct order
            models = [User, Question, QuestionAnalytics]
            for model in models:
                model.__table__.create(db.engine, checkfirst=True)
                logger.info(f"Created/verified table: {model.__tablename__}")
            
            # Create default admin user if needed
            admin_username = os.getenv('ADMIN_USERNAME')
            admin_password = os.getenv('ADMIN_PASSWORD')
            
            if not admin_username or not admin_password:
                raise ValueError("Admin credentials not found in environment variables")
            
            existing_admin = User.query.filter_by(username=admin_username).first()
            if not existing_admin:
                admin = User(username=admin_username, is_admin=True)
                admin.set_password(admin_password)
                db.session.add(admin)
                db.session.commit()
                logger.info(f"Created default admin user: {admin_username}")
            
            logger.info("Database initialization completed successfully!")
            
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()
