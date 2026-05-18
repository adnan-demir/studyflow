from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
from pgvector.sqlalchemy import Vector
from datetime import datetime, UTC
from config.settings import get_settings

settings = get_settings()

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class DocumentChunk(Base):
    __tablename__ = "DocumentChunk"

    id = Column(String, primary_key=True)
    courseId = Column(String, nullable=False, index=True)
    studyMaterialId = Column(String, nullable=False, index=True)
    content = Column(Text, nullable=False)
    chunkIndex = Column(Integer, nullable=False)
    pageNumber = Column(Integer, nullable=True)
    chunk_metadata = Column("metadata", JSON, nullable=True)
    embedding = Column(Vector(settings.embedding_dimensions), nullable=True)
    createdAt = Column(DateTime, default=lambda: datetime.now(UTC))


class StudyMaterial(Base):
    __tablename__ = "StudyMaterial"

    id = Column(String, primary_key=True)
    userId = Column(String, nullable=False)
    courseId = Column(String, nullable=False)
    originalFilename = Column(String, nullable=False)
    storedFilename = Column(String, nullable=False)
    fileUrl = Column(String, nullable=True)
    mimeType = Column(String, nullable=False)
    fileSize = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="PENDING")
    processingError = Column(Text, nullable=True)
    pageCount = Column(Integer, nullable=True)
    chunkCount = Column(Integer, nullable=True)
    createdAt = Column(DateTime, default=lambda: datetime.now(UTC))
    updatedAt = Column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
