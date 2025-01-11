import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Update URL to explicitly use postgresql dialect
POSTGRES_URL = os.getenv('POSTGRES_URL_NON_POOLING')
if POSTGRES_URL and not POSTGRES_URL.startswith('postgresql://'):
    POSTGRES_URL = POSTGRES_URL.replace('postgres://', 'postgresql://')

engine = create_engine(POSTGRES_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
