export type AssistantRecord = {
  id: number;
  publicId: string;
  name: string;
  status: string;
  assistantType: string;
  targetGoal: string | null;
  personality: string | null;
  tone: string | null;
  expertiseAreas: string | null;
  instructions: string | null;
  contextData: Record<string, unknown>;
  knowledgeSources: Array<{ title?: string; content?: string }>;
  engagementSettings: Record<string, unknown>;
  triggerConfig: Record<string, unknown>;
  deploymentConfig: Record<string, unknown>;
  captureFlowPublicId: string | null;
  linkedToolId: number | null;
  linkedProjectId: number | null;
  assetType: string | null;
  assetKey: string;
  niche: string | null;
  monetizationGoal: string | null;
  theme: string;
  widgetPosition: string;
  totalConversations: number;
  totalMessages: number;
  conversionRate: number;
  avgSatisfactionScore: number | null;
  engagementScore: number;
  leadInfluenceCount: number;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudioOverview = {
  totalAssistants: number;
  activeAssistants: number;
  totalConversations: number;
  totalMessages: number;
  leadInfluence: number;
  avgConversionRate: number;
  engagementRate: number;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText);
  return data as T;
}

export function fetchStudioOverview() {
  return api<{
    assistants: AssistantRecord[];
    overview: StudioOverview;
    recentActivity: Array<{ event_type: string; created_at: string; assistant_name: string }>;
    topQuestions: Array<{ message_content: string; cnt: number }>;
    error?: string;
  }>("/api/assistants/studio/overview");
}

export function fetchAssistants() {
  return api<{ assistants: AssistantRecord[] }>("/api/assistants");
}

export function fetchAssistant(id: number) {
  return api<{ assistant: AssistantRecord; deployments: unknown[] }>(`/api/assistants/${id}`);
}

export function createAssistant(body: Record<string, unknown>) {
  return api<{ assistant: AssistantRecord }>("/api/assistants", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAssistant(id: number, body: Record<string, unknown>) {
  return api<{ assistant: AssistantRecord }>(`/api/assistants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteAssistant(id: number) {
  return api<{ success: boolean }>(`/api/assistants/${id}`, { method: "DELETE" });
}

export function pauseAssistant(id: number) {
  return api<{ success: boolean }>(`/api/assistants/${id}/pause`, { method: "POST" });
}

export function activateAssistant(id: number) {
  return api<{ success: boolean }>(`/api/assistants/${id}/activate`, { method: "POST" });
}

export function duplicateAssistant(id: number) {
  return api<{ assistant: AssistantRecord }>(`/api/assistants/${id}/duplicate`, { method: "POST" });
}

export function deployAssistant(id: number, body: Record<string, unknown>) {
  return api<{ snippet: string; publicId: string; widgetUrl: string }>(`/api/assistants/${id}/deploy`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function generateAssistantContext(body: Record<string, unknown>) {
  return api<{ context: Record<string, unknown> }>("/api/assistants/generate-context", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function captureConversationLead(
  conversationId: number,
  body: { email: string; name?: string; assistantId: number; captureFlowPublicId?: string; assetKey?: string },
) {
  return api<{ success: boolean }>(`/api/conversations/${conversationId}/lead`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function streamAssistantChat(
  assistantId: number,
  message: string,
  opts: {
    conversationId?: number | null;
    pageContext?: Record<string, unknown>;
    onToken: (token: string) => void;
    onDone?: (data: { conversationId?: number }) => void;
    onError?: (msg: string) => void;
    signal?: AbortSignal;
  },
) {
  const res = await fetch(`/api/assistants/${assistantId}/chat`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversationId: opts.conversationId,
      pageContext: opts.pageContext,
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    opts.onError?.((err as { error?: string }).error || "Chat failed");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";
    for (const block of parts) {
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      if (!data) continue;
      try {
        const json = JSON.parse(data) as { token?: string; message?: string; conversationId?: number };
        if (event === "token" && json.token) opts.onToken(json.token);
        if (event === "done") opts.onDone?.(json);
        if (event === "error") opts.onError?.(json.message || "Error");
      } catch {
        /* ignore parse */
      }
    }
  }
}
