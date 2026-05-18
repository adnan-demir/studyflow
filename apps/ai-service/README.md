# StudyFlow AI Service

Python FastAPI service for AI/RAG functionality.

## Current Status: Phase 1 Skeleton

The service is a skeleton only. No AI features are implemented yet.
All endpoints are marked as TODO and will be implemented in Phase 2+.

## Setup

```bash
cd apps/ai-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
# Edit .env with your values

# Run development server
python main.py
```

The service will be available at `http://localhost:8000`.

API docs: `http://localhost:8000/docs`

## Planned Features (Phase 2+)

- PDF parsing and text extraction
- Document chunking with metadata
- Embeddings generation (pgvector storage)
- RAG-based AI chat (Notes Only + Hybrid modes)
- Summary generation
- Quiz generation
- Weak topic analysis
