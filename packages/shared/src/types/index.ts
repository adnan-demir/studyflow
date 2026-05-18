// Shared types used across apps/web and apps/ai-service API contracts

// ─────────────────────────────────────────────────────────────
// Domain enums
// ─────────────────────────────────────────────────────────────

export type CourseStatus = "active" | "archived";

export type StudyMaterialStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type ChatMode = "NOTES_ONLY" | "HYBRID";

export type ChatRole = "USER" | "ASSISTANT";

export type ActivityType = "CHAT" | "QUIZ" | "SUMMARY" | "NOTES" | "VOICE";

export type SummaryType = "SHORT" | "DETAILED" | "BULLET" | "EXAM_FOCUSED";

// ─────────────────────────────────────────────────────────────
// Source transparency
// ─────────────────────────────────────────────────────────────

export interface SourceReference {
  documentId: string;       // studyMaterialId
  documentName: string;
  pageNumber?: number;
  chunkPreview: string;     // First ~120 chars of the chunk
  similarityScore?: number; // 0–1
  retrievalRank?: number;   // 1-based rank from vector search
}

// ─────────────────────────────────────────────────────────────
// Document processing
// ─────────────────────────────────────────────────────────────

export interface ParseRequest {
  materialId: string;
  courseId: string;
  filePath: string;
  mimeType: string;
}

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface ParseResponse {
  materialId: string;
  pageCount: number;
  pages: ParsedPage[];
}

export interface EmbedRequest {
  materialId: string;
  courseId: string;
  chunks: {
    chunkId: string;
    content: string;
  }[];
}

export interface EmbedResponse {
  materialId: string;
  embeddedCount: number;
}

// ─────────────────────────────────────────────────────────────
// Retrieval
// ─────────────────────────────────────────────────────────────

export interface RetrievalResult {
  chunkId: string;
  content: string;
  pageNumber?: number;
  chunkIndex: number;
  materialId: string;
  documentName: string;
  similarityScore: number;
}

// ─────────────────────────────────────────────────────────────
// Chat
// ─────────────────────────────────────────────────────────────

export interface ChatRequest {
  sessionId: string;
  courseId: string;
  message: string;
  mode: ChatMode;
  history: { role: ChatRole; content: string }[];
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ChatResponse {
  answer: string;
  sources: SourceReference[];
  mode: ChatMode;
  tokenUsage?: TokenUsage;
  promptVersion?: string;
}

// ─────────────────────────────────────────────────────────────
// Summaries
// ─────────────────────────────────────────────────────────────

export interface SummaryRequest {
  courseId: string;
  materialIds: string[];
  summaryType: SummaryType;
  mode: ChatMode;
}

export interface SummaryResponse {
  title: string;
  content: string;
  sources: SourceReference[];
}

// ─────────────────────────────────────────────────────────────
// Legacy / Phase 3+ types (kept for schema reference)
// ─────────────────────────────────────────────────────────────

export interface QuizGenerationRequest {
  courseId: string;
  topic?: string;
  questionCount: number;
}

export interface QuizGenerationResponse {
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }[];
}

export interface WeakTopicAnalysisRequest {
  courseId: string;
  userId: string;
  quizAttempts: {
    score: number;
    totalQuestions: number;
    answeredAt: string;
  }[];
}

export interface WeakTopicAnalysisResponse {
  topics: {
    topic: string;
    confidence: number;
  }[];
}

export type ExamCountdownVariant = "upcoming" | "today" | "passed" | "none";

export interface ExamCountdownResult {
  variant: ExamCountdownVariant;
  daysLabel: string;
  message: string;
}
