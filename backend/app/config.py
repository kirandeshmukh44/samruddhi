# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./samruddhi.db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "samruddhi-secret-key-production-change"))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    APP_NAME: str = "BiLU ERP API"
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

settings = Settings()
DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
