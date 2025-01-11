import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY')
    DEBUG = os.getenv('FLASK_DEBUG').lower() == 'true'
    HOST = os.getenv('FLASK_HOST')
    PORT = int(os.getenv('FLASK_PORT'))

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

    # Security settings
    PEPPER = os.getenv('PEPPER')  # Change in production
    PASSWORD_HASH_TIME_COST = 2      # Number of iterations
    PASSWORD_HASH_MEMORY_COST = 102400  # Memory usage in KiB
    PASSWORD_HASH_PARALLELISM = 8    # Number of parallel threads
    PASSWORD_HASH_LENGTH = 32        # Length of the hash in bytes
    PASSWORD_SALT_LENGTH = 16        # Length of the salt in bytes
