"""Configuracion de la base de datos SQLite."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = "sqlite:///./khipu_pagos.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency de FastAPI para obtener una sesion de DB."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
