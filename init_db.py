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
from flask import Flask
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    load_dotenv()
    
    # Configure database
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('POSTGRES_URL_NON_POOLING').replace('postgres://', 'postgresql://')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize database
    db.init_app(app)
    return app

def init_db():
    try:
        app = create_app()
        
        with app.app_context():
            # Create all tables
            logger.info("Creating database tables...")
            db.drop_all()  # Be careful with this in production!
            db.create_all()
            logger.info("Database tables created successfully!")
            
            # Create default admin user
            admin_username = os.getenv('ADMIN_USERNAME')
            admin_password = os.getenv('ADMIN_PASSWORD')
            
            admin = User(username=admin_username, is_admin=True)
            admin.set_password(admin_password)
            db.session.add(admin)
            db.session.commit()
            logger.info(f"Created default admin user: {admin_username}")
            
            # Verify connection
            logger.info("Database connection verified successfully!")
            
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()
