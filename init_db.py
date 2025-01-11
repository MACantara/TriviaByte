import os
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.absolute())
sys.path.insert(0, project_root)

from dotenv import load_dotenv
from config.database import Base, engine
from models.quiz import Question
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    try:
        # Load environment variables
        load_dotenv()
        
        # Create all tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully!")
        
        # Verify connection
        with engine.connect() as connection:
            logger.info("Database connection verified successfully!")
            
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

if __name__ == "__main__":
    init_db()
