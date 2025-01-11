import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    HOST = os.getenv('FLASK_HOST', '127.0.0.1')
    PORT = int(os.getenv('FLASK_PORT', 5000))

    # Database settings
    POSTGRES_URL = os.getenv('POSTGRES_URL_NON_POOLING')
    POSTGRES_USER = os.getenv('POSTGRES_USER')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD')
    POSTGRES_HOST = os.getenv('POSTGRES_HOST')
    POSTGRES_DATABASE = os.getenv('POSTGRES_DATABASE')

    # AI Service settings
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

    # Flask-SQLAlchemy settings
    SQLALCHEMY_DATABASE_URI = POSTGRES_URL.replace('postgres://', 'postgresql://')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
