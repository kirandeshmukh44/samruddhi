# backend/app/database.py
# SQLAlchemy 2.0 database setup. SQLite now, PostgreSQL later via DATABASE_URL.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from app.config import DATABASE_URL

# check_same_thread=False is needed for SQLite with FastAPI (multi-thread).
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    # Import models so they register with Base.metadata
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
