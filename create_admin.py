import os
import sys
from pathlib import Path
from flask import Flask
from dotenv import load_dotenv
from config.database import db
from models.user import User
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('POSTGRES_URL_NON_POOLING').replace('postgres://', 'postgresql://')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    return app

def create_admin(username: str, password: str) -> None:
    """Create an admin user with the given credentials."""
    try:
        app = create_app()
        
        with app.app_context():
            # Check if admin already exists
            existing_admin = User.query.filter_by(username=username).first()
            if existing_admin:
                logger.warning(f"Admin user '{username}' already exists!")
                return

            # Validate password
            if len(password) < 8:
                raise ValueError("Password must be at least 8 characters long")

            # Create new admin user
            admin = User(username=username, is_admin=True)
            admin.set_password(password)
            
            db.session.add(admin)
            db.session.commit()
            logger.info(f"Admin user '{username}' created successfully!")

    except Exception as e:
        logger.error(f"Failed to create admin user: {str(e)}")
        sys.exit(1)

def main():
    if len(sys.argv) != 3:
        print("Usage: python create_admin.py <username> <password>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    try:
        create_admin(username, password)
    except KeyboardInterrupt:
        logger.info("\nOperation cancelled by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
