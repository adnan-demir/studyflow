// Shared types used across apps/web and apps/ai-service API contracts

export type CourseStatus = "active" | "archived";

export type StudyMaterialStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export type ChatMode = "NOTES_ONLY" | "HYBRID";

export type ChatRole = "USER" | "ASSISTANT";

export type ActivityType = "CHAT" | "QUIZ" | "SUMMARY" | "NOTES" | "VOICE";

// AI Service API contracts

export interface ChunkRequest {
  studyMaterialId: string;
  courseId: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface ChunkResponse {
  chunks: {
    content: string;
    chunkIndex: number;
    pageNumber?: number;
  }[];
}

export interface ChatRequest {
  sessionId: string;
  courseId: string;
  message: string;
  mode: ChatMode;
  history: { role: ChatRole; content: string }[];
}

export interface ChatResponse {
  answer: string;
  sources: { documentId: string; content: string; pageNumber?: number }[];
  mode: ChatMode;
}

export interface SummaryRequest {
  courseId: string;
  studyMaterialIds: string[];
}

export interface SummaryResponse {
  title: string;
  content: string;
}

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

// Exam countdown helper types
export type ExamCountdownVariant = "upcoming" | "today" | "passed" | "none";

export interface ExamCountdownResult {
  variant: ExamCountdownVariant;
  daysLabel: string;
  message: string;
}
