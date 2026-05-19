import type { D1Like } from "../audience/audienceRateLimit";

export interface AssistantContextMemory {
  id: number;
  assistantId: number;
  userId: string;
  visitorSessionId?: string;
  projectId?: number;
  niche?: string;
  tonePreference?: string;
  designStylePreference?: string;
  targetAudience?: string;
  monetizationModel?: string;
  businessGoal?: string;
  preferredFeatures?: string;
  contextData?: string;
  lastInteractionAt?: string;
}

/**
 * Save or update context memory for an assistant conversation
 */
export async function saveContextMemory(
  db: D1Like,
  data: {
    assistantId: number;
    userId: string;
    visitorSessionId?: string;
    projectId?: number;
    niche?: string;
    tonePreference?: string;
    designStylePreference?: string;
    targetAudience?: string;
    monetizationModel?: string;
    businessGoal?: string;
    preferredFeatures?: string;
    contextData?: Record<string, unknown>;
  },
): Promise<void> {
  const now = new Date().toISOString();
  
  // Check if context memory already exists
  const existing = await db
    .prepare(
      `SELECT id FROM assistant_context_memory 
       WHERE assistant_id = ? AND user_id = ? AND (visitor_session_id = ? OR visitor_session_id IS NULL)
       LIMIT 1`,
    )
    .bind(data.assistantId, data.userId, data.visitorSessionId || null)
    .first();

  const contextJson = data.contextData ? JSON.stringify(data.contextData) : null;

  if (existing) {
    // Update existing memory
    const existingRow = existing as Record<string, unknown>;
    await db
      .prepare(
        `UPDATE assistant_context_memory SET
          project_id = ?,
          niche = ?,
          tone_preference = ?,
          design_style_preference = ?,
          target_audience = ?,
          monetization_model = ?,
          business_goal = ?,
          preferred_features = ?,
          context_data = ?,
          last_interaction_at = ?,
          updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        data.projectId || null,
        data.niche || null,
        data.tonePreference || null,
        data.designStylePreference || null,
        data.targetAudience || null,
        data.monetizationModel || null,
        data.businessGoal || null,
        data.preferredFeatures || null,
        contextJson,
        now,
        now,
        existingRow.id as number,
      )
      .run();
  } else {
    // Insert new memory
    await db
      .prepare(
        `INSERT INTO assistant_context_memory (
          assistant_id, user_id, visitor_session_id, project_id, niche,
          tone_preference, design_style_preference, target_audience,
          monetization_model, business_goal, preferred_features, context_data,
          last_interaction_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.assistantId,
        data.userId,
        data.visitorSessionId || null,
        data.projectId || null,
        data.niche || null,
        data.tonePreference || null,
        data.designStylePreference || null,
        data.targetAudience || null,
        data.monetizationModel || null,
        data.businessGoal || null,
        data.preferredFeatures || null,
        contextJson,
        now,
        now,
        now,
      )
      .run();
  }
}

/**
 * Load context memory for an assistant conversation
 */
export async function loadContextMemory(
  db: D1Like,
  assistantId: number,
  userId: string,
  visitorSessionId?: string,
): Promise<AssistantContextMemory | null> {
  const row = await db
    .prepare(
      `SELECT * FROM assistant_context_memory 
       WHERE assistant_id = ? AND user_id = ? AND (visitor_session_id = ? OR visitor_session_id IS NULL)
       ORDER BY last_interaction_at DESC
       LIMIT 1`,
    )
    .bind(assistantId, userId, visitorSessionId || null)
    .first();

  if (!row) return null;

  const r = row as Record<string, unknown>;
  return {
    id: r.id as number,
    assistantId: r.assistant_id as number,
    userId: r.user_id as string,
    visitorSessionId: (r.visitor_session_id as string) || undefined,
    projectId: (r.project_id as number) || undefined,
    niche: (r.niche as string) || undefined,
    tonePreference: (r.tone_preference as string) || undefined,
    designStylePreference: (r.design_style_preference as string) || undefined,
    targetAudience: (r.target_audience as string) || undefined,
    monetizationModel: (r.monetization_model as string) || undefined,
    businessGoal: (r.business_goal as string) || undefined,
    preferredFeatures: (r.preferred_features as string) || undefined,
    contextData: (r.context_data as string) || undefined,
    lastInteractionAt: (r.last_interaction_at as string) || undefined,
  };
}

/**
 * Extract and save intent-based context from conversation
 */
export async function extractAndSaveContext(
  db: D1Like,
  assistantId: number,
  userId: string,
  message: string,
  visitorSessionId?: string,
): Promise<void> {
  const lowerMsg = message.toLowerCase();
  const updates: {
    assistantId: number;
    userId: string;
    visitorSessionId?: string;
    niche?: string;
    tonePreference?: string;
    designStylePreference?: string;
    targetAudience?: string;
    monetizationModel?: string;
    businessGoal?: string;
    contextData?: Record<string, unknown>;
  } = { assistantId, userId, visitorSessionId };

  // Detect niche mentions
  const niches = [
    "tech", "saas", "ecommerce", "fitness", "health", "finance", "real estate",
    "education", "marketing", "consulting", "legal", "travel", "food", "fashion",
  ];
  for (const niche of niches) {
    if (lowerMsg.includes(niche)) {
      updates.niche = niche;
      break;
    }
  }

  // Detect design style preferences
  if (lowerMsg.includes("modern") || lowerMsg.includes("minimal")) {
    updates.designStylePreference = "modern";
  } else if (lowerMsg.includes("premium") || lowerMsg.includes("luxury")) {
    updates.designStylePreference = "premium";
  } else if (lowerMsg.includes("tech") || lowerMsg.includes("futuristic")) {
    updates.designStylePreference = "tech-forward";
  } else if (lowerMsg.includes("professional") || lowerMsg.includes("corporate")) {
    updates.designStylePreference = "professional";
  }

  // Detect tone preferences
  if (lowerMsg.includes("friendly") || lowerMsg.includes("casual")) {
    updates.tonePreference = "friendly";
  } else if (lowerMsg.includes("professional") || lowerMsg.includes("formal")) {
    updates.tonePreference = "professional";
  } else if (lowerMsg.includes("expert") || lowerMsg.includes("authority")) {
    updates.tonePreference = "expert";
  }

  // Detect monetization intent
  if (lowerMsg.includes("affiliate") || lowerMsg.includes("commission")) {
    updates.monetizationModel = "affiliate";
  } else if (lowerMsg.includes("lead gen") || lowerMsg.includes("email")) {
    updates.monetizationModel = "lead-generation";
  } else if (lowerMsg.includes("sell") || lowerMsg.includes("product")) {
    updates.monetizationModel = "direct-sales";
  }

  // Detect business goals
  if (lowerMsg.includes("traffic") || lowerMsg.includes("visitors")) {
    updates.businessGoal = "increase-traffic";
  } else if (lowerMsg.includes("conversion") || lowerMsg.includes("leads")) {
    updates.businessGoal = "improve-conversions";
  } else if (lowerMsg.includes("revenue") || lowerMsg.includes("money")) {
    updates.businessGoal = "generate-revenue";
  } else if (lowerMsg.includes("brand") || lowerMsg.includes("authority")) {
    updates.businessGoal = "build-authority";
  }

  // Only save if we detected something
  if (
    updates.niche ||
    updates.tonePreference ||
    updates.designStylePreference ||
    updates.monetizationModel ||
    updates.businessGoal
  ) {
    await saveContextMemory(db, updates);
  }
}

/**
 * Log workflow action triggered by assistant
 */
export async function logWorkflowAction(
  db: D1Like,
  data: {
    assistantId: number;
    conversationId: string;
    actionType: string;
    actionPayload?: Record<string, unknown>;
    intentDetected?: string;
    confidenceScore?: number;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const payload = data.actionPayload ? JSON.stringify(data.actionPayload) : null;

  await db
    .prepare(
      `INSERT INTO assistant_workflow_actions (
        assistant_id, conversation_id, action_type, action_payload,
        intent_detected, confidence_score, execution_status,
        triggered_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      data.assistantId,
      data.conversationId,
      data.actionType,
      payload,
      data.intentDetected || null,
      data.confidenceScore || null,
      "pending",
      now,
      now,
      now,
    )
    .run();
}

/**
 * Build context-aware prompt additions from memory
 */
export function buildMemoryPromptAdditions(memory: AssistantContextMemory | null): string {
  if (!memory) return "";

  const additions: string[] = [];

  if (memory.niche) {
    additions.push(`REMEMBERED NICHE: ${memory.niche}`);
  }
  if (memory.designStylePreference) {
    additions.push(`PREFERRED DESIGN STYLE: ${memory.designStylePreference}`);
  }
  if (memory.tonePreference) {
    additions.push(`PREFERRED TONE: ${memory.tonePreference}`);
  }
  if (memory.targetAudience) {
    additions.push(`TARGET AUDIENCE: ${memory.targetAudience}`);
  }
  if (memory.monetizationModel) {
    additions.push(`MONETIZATION APPROACH: ${memory.monetizationModel}`);
  }
  if (memory.businessGoal) {
    additions.push(`PRIMARY GOAL: ${memory.businessGoal}`);
  }
  if (memory.preferredFeatures) {
    additions.push(`FEATURE PREFERENCES: ${memory.preferredFeatures}`);
  }

  if (additions.length === 0) return "";

  return `\n\nCONTEXT MEMORY (from previous interactions):
${additions.join("\n")}

Use this context to provide more personalized and relevant recommendations. Reference these preferences naturally when making suggestions.`;
}
