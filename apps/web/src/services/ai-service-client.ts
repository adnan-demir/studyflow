import type {
  ChatRequest,
  ChatResponse,
  SummaryRequest,
  SummaryResponse,
} from "@studyflow/shared";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${AI_SERVICE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // Allow up to 60 s for LLM calls
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`AI service error (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export interface ProcessDocumentRequest {
  materialId: string;
  courseId: string;
  filePath: string;
  mimeType: string;
}

export interface ProcessDocumentResponse {
  materialId: string;
  status: string;
  pageCount: number;
  chunkCount: number;
}

export async function processDocument(
  req: ProcessDocumentRequest
): Promise<ProcessDocumentResponse> {
  return post<ProcessDocumentResponse>("/documents/process", req);
}

export async function sendChatMessage(req: ChatRequest): Promise<ChatResponse> {
  return post<ChatResponse>("/chat", req);
}

export async function generateSummary(req: SummaryRequest): Promise<SummaryResponse> {
  return post<SummaryResponse>("/summaries/generate", req);
}
