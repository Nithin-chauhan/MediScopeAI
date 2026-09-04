from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./mediscope.db")

if "ssl-mode=REQUIRED" in DATABASE_URL:
    # PyMySQL doesn't support the 'ssl-mode' URL parameter, so we strip it 
    # and pass the SSL context explicitly via connect_args
    DATABASE_URL = DATABASE_URL.replace("?ssl-mode=REQUIRED", "").replace("&ssl-mode=REQUIRED", "")
    engine = create_engine(DATABASE_URL, connect_args={"ssl": {}})
elif DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
