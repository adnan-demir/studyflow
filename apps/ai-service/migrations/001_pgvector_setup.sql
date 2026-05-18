-- ============================================================
-- Migration 001 — pgvector setup for StudyFlow AI
-- Run once after the Prisma schema has been pushed (prisma db push).
-- ============================================================

-- 1. Enable the pgvector extension (Supabase has it pre-installed; just activate).
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. HNSW index for fast cosine-similarity search.
--    HNSW provides better recall and faster queries than IVFFlat for typical workloads.
--    Requires pgvector >= 0.5.0 (available on Supabase).
--
--    Parameters:
--      m        = max connections per layer (default 16, higher = better recall + more memory)
--      ef_construction = build-time beam width (default 64, higher = better index quality)
--
CREATE INDEX IF NOT EXISTS document_chunk_embedding_hnsw_idx
    ON "DocumentChunk"
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 3. Support index on courseId for the WHERE clause used in every search query.
--    (Prisma already creates this; included here for completeness.)
CREATE INDEX IF NOT EXISTS document_chunk_course_id_idx
    ON "DocumentChunk" ("courseId");

CREATE INDEX IF NOT EXISTS document_chunk_material_id_idx
    ON "DocumentChunk" ("studyMaterialId");

-- ──────────────────────────────────────────────────────────────
-- Alternative: IVFFlat (use instead of HNSW if pgvector < 0.5.0)
--
-- IVFFlat requires knowing the approximate row count in advance.
-- Set lists ≈ sqrt(expected_row_count).  For < 1 M rows, 100 is fine.
--
-- CREATE INDEX IF NOT EXISTS document_chunk_embedding_ivfflat_idx
--     ON "DocumentChunk"
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);
--
-- After bulk-inserting rows, run to update the index:
-- SELECT ivfflat_reindex('document_chunk_embedding_ivfflat_idx');
-- ──────────────────────────────────────────────────────────────

-- 4. Verify.
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'DocumentChunk'
ORDER BY indexname;
