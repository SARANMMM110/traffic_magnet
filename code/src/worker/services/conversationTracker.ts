// Conversation Tracking Service
// Handles storage and tracking of AI assistant conversations

import { generateSystemPrompt, generateOpeningMessage, enrichContextWithData, AssistantConfig, ConversationContext } from './assistantPrompts';

interface D1Like {
  prepare(query: string): {
    bind(...values: any[]): {
      run(): Promise<any>;
      first(): Promise<any>;
      all(): Promise<any>;
    };
  };
}

interface Assistant {
  id: number;
  user_id: string;
  name: string;
  status: string;
  assistant_type: string;
  target_goal?: string | null;
  personality?: string | null;
  tone?: string | null;
  expertise_areas?: string | null;
  instructions?: string | null;
  context_data?: string | null;
  trigger_config?: string | null;
  deployment_config?: string | null;
  public_id: string;
}



interface Message {
  id: number;
  conversation_id: number;
  assistant_id: number;
  message_role: string;
  message_content: string;
  message_type?: string | null;
  attachment_data?: string | null;
  response_time_ms?: number | null;
  created_at: string;
}

// ============================================================================
// CONVERSATION MANAGEMENT
// ============================================================================

export async function startConversation(
  db: D1Like,
  assistantId: number,
  context?: {
    userId?: string;
    visitorSessionHash?: string;
    currentPage?: string;
    referringSource?: string;
    metaJson?: Record<string, any>;
  }
): Promise<{ conversationId: number; openingMessage: string; systemPrompt: string }> {
  // Get assistant config
  const assistant = await db
    .prepare('SELECT * FROM ai_assistants WHERE id = ? LIMIT 1')
    .bind(assistantId)
    .first() as Assistant | null;

  if (!assistant) {
    throw new Error('Assistant not found');
  }

  if (assistant.status !== 'active') {
    throw new Error('Assistant is not active');
  }

  // Create conversation record
  const conversationData = {
    pages_viewed: context?.currentPage ? [context.currentPage] : [],
    referring_source: context?.referringSource || 'direct',
    session_start: new Date().toISOString(),
  };

  const result = await db
    .prepare(`
      INSERT INTO ai_conversations (
        assistant_id, user_id, visitor_session_hash, conversation_status,
        total_messages, lead_captured, conversion_achieved, conversation_data, meta_json,
        started_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      assistantId,
      context?.userId || null,
      context?.visitorSessionHash || null,
      'active',
      0,
      0,
      0,
      JSON.stringify(conversationData),
      context?.metaJson ? JSON.stringify(context.metaJson) : null,
      new Date().toISOString(),
      new Date().toISOString(),
      new Date().toISOString()
    )
    .run();

  const conversationId = result.meta.last_row_id as number;

  // Generate system prompt and opening message
  const assistantConfig: AssistantConfig = {
    name: assistant.name,
    assistant_type: assistant.assistant_type,
    target_goal: assistant.target_goal,
    personality: assistant.personality,
    tone: assistant.tone,
    expertise_areas: assistant.expertise_areas,
    instructions: assistant.instructions,
    context_data: assistant.context_data,
  };

  const conversationContext: ConversationContext = {
    current_page: context?.currentPage,
    referring_source: context?.referringSource,
  };

  const enrichedContext = enrichContextWithData(assistantConfig, conversationContext);
  const systemPrompt = generateSystemPrompt(assistantConfig, enrichedContext);
  const openingMessage = generateOpeningMessage(assistantConfig, enrichedContext);

  // Store opening message
  await addMessage(db, conversationId, assistantId, 'assistant', openingMessage, 'greeting');

  // Update assistant stats
  await db
    .prepare('UPDATE ai_assistants SET total_conversations = total_conversations + 1, last_active_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), assistantId)
    .run();

  // Track analytics event
  await trackEvent(db, assistantId, conversationId, context?.userId, 'conversation_started', 'engagement', null, {
    current_page: context?.currentPage,
    referring_source: context?.referringSource,
  }, context?.visitorSessionHash);

  return { conversationId, openingMessage, systemPrompt };
}

export async function addMessage(
  db: D1Like,
  conversationId: number,
  assistantId: number,
  role: 'user' | 'assistant',
  content: string,
  messageType?: string,
  attachmentData?: Record<string, any>,
  responseTimeMs?: number
): Promise<number> {
  const result = await db
    .prepare(`
      INSERT INTO ai_messages (
        conversation_id, assistant_id, message_role, message_content,
        message_type, attachment_data, response_time_ms, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      conversationId,
      assistantId,
      role,
      content,
      messageType || null,
      attachmentData ? JSON.stringify(attachmentData) : null,
      responseTimeMs || null,
      new Date().toISOString(),
      new Date().toISOString()
    )
    .run();

  // Update conversation message count
  await db
    .prepare('UPDATE ai_conversations SET total_messages = total_messages + 1, updated_at = ? WHERE id = ?')
    .bind(new Date().toISOString(), conversationId)
    .run();

  // Update assistant stats
  await db
    .prepare('UPDATE ai_assistants SET total_messages = total_messages + 1 WHERE id = ?')
    .bind(assistantId)
    .run();

  return result.meta.last_row_id as number;
}

export async function getConversationHistory(
  db: D1Like,
  conversationId: number,
  limit: number = 50
): Promise<Message[]> {
  const result = await db
    .prepare(`
      SELECT * FROM ai_messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
      LIMIT ?
    `)
    .bind(conversationId, limit)
    .all();

  return result.results as Message[];
}

export async function updateConversationStatus(
  db: D1Like,
  conversationId: number,
  status: 'active' | 'completed' | 'abandoned' | 'converted'
): Promise<void> {
  const endedAt = status === 'active' ? null : new Date().toISOString();

  await db
    .prepare('UPDATE ai_conversations SET conversation_status = ?, ended_at = ?, updated_at = ? WHERE id = ?')
    .bind(status, endedAt, new Date().toISOString(), conversationId)
    .run();
}

// ============================================================================
// LEAD CAPTURE TRACKING
// ============================================================================

export async function captureLeadInfo(
  db: D1Like,
  conversationId: number,
  assistantId: number,
  email: string,
  name?: string,
  userId?: string
): Promise<void> {
  await db
    .prepare(`
      UPDATE ai_conversations
      SET lead_captured = 1, lead_email = ?, lead_name = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(email, name || null, new Date().toISOString(), conversationId)
    .run();

  // Track analytics event
  await trackEvent(db, assistantId, conversationId, userId, 'lead_captured', 'conversion', 1, {
    email,
    name: name || null,
  });
}

export async function recordConversion(
  db: D1Like,
  conversationId: number,
  assistantId: number,
  conversionType: string,
  conversionValue?: number,
  userId?: string
): Promise<void> {
  await db
    .prepare(`
      UPDATE ai_conversations
      SET conversion_achieved = 1, conversion_type = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(conversionType, new Date().toISOString(), conversationId)
    .run();

  // Update assistant conversion rate
  const stats = await db
    .prepare(`
      SELECT
        COUNT(*) as total_conversations,
        SUM(CASE WHEN conversion_achieved = 1 THEN 1 ELSE 0 END) as conversions
      FROM ai_conversations
      WHERE assistant_id = ?
    `)
    .bind(assistantId)
    .first() as { total_conversations: number; conversions: number } | null;

  if (stats && stats.total_conversations > 0) {
    const conversionRate = (stats.conversions / stats.total_conversations) * 100;
    await db
      .prepare('UPDATE ai_assistants SET conversion_rate = ? WHERE id = ?')
      .bind(conversionRate, assistantId)
      .run();
  }

  // Track analytics event
  await trackEvent(db, assistantId, conversationId, userId, 'conversion', 'conversion', conversionValue, {
    conversion_type: conversionType,
  });
}

export async function recordSatisfactionScore(
  db: D1Like,
  conversationId: number,
  assistantId: number,
  score: number,
  userId?: string
): Promise<void> {
  await db
    .prepare('UPDATE ai_conversations SET satisfaction_score = ?, updated_at = ? WHERE id = ?')
    .bind(score, new Date().toISOString(), conversationId)
    .run();

  // Update assistant average satisfaction
  const stats = await db
    .prepare(`
      SELECT AVG(satisfaction_score) as avg_score
      FROM ai_conversations
      WHERE assistant_id = ? AND satisfaction_score IS NOT NULL
    `)
    .bind(assistantId)
    .first() as { avg_score: number } | null;

  if (stats && stats.avg_score !== null) {
    await db
      .prepare('UPDATE ai_assistants SET avg_satisfaction_score = ? WHERE id = ?')
      .bind(stats.avg_score, assistantId)
      .run();
  }

  // Track analytics event
  await trackEvent(db, assistantId, conversationId, userId, 'satisfaction_rated', 'feedback', score);
}

// ============================================================================
// ANALYTICS TRACKING
// ============================================================================

export async function trackEvent(
  db: D1Like,
  assistantId: number,
  conversationId: number | null,
  userId: string | null | undefined,
  eventType: string,
  eventCategory?: string,
  eventValue?: number | null,
  eventMeta?: Record<string, any>,
  sessionHash?: string | null | undefined
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO ai_analytics_events (
        assistant_id, conversation_id, user_id, event_type, event_category,
        event_value, event_meta, session_hash, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      assistantId,
      conversationId,
      userId || null,
      eventType,
      eventCategory || null,
      eventValue !== undefined ? eventValue : null,
      eventMeta ? JSON.stringify(eventMeta) : null,
      sessionHash || null,
      new Date().toISOString(),
      new Date().toISOString()
    )
    .run();
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export async function getAssistantAnalytics(
  db: D1Like,
  assistantId: number,
  timeRange: 'day' | 'week' | 'month' | 'all' = 'week'
): Promise<{
  total_conversations: number;
  active_conversations: number;
  completed_conversations: number;
  total_messages: number;
  leads_captured: number;
  conversions: number;
  avg_satisfaction: number | null;
  conversion_rate: number;
  avg_messages_per_conversation: number;
  events_by_type: Record<string, number>;
}> {
  const timeFilter = getTimeFilter(timeRange);

  // Get conversation stats
  const conversationStats = await db
    .prepare(`
      SELECT
        COUNT(*) as total_conversations,
        SUM(CASE WHEN conversation_status = 'active' THEN 1 ELSE 0 END) as active_conversations,
        SUM(CASE WHEN conversation_status = 'completed' OR conversation_status = 'converted' THEN 1 ELSE 0 END) as completed_conversations,
        SUM(total_messages) as total_messages,
        SUM(CASE WHEN lead_captured = 1 THEN 1 ELSE 0 END) as leads_captured,
        SUM(CASE WHEN conversion_achieved = 1 THEN 1 ELSE 0 END) as conversions,
        AVG(satisfaction_score) as avg_satisfaction
      FROM ai_conversations
      WHERE assistant_id = ? ${timeFilter}
    `)
    .bind(assistantId)
    .first() as any;

  const stats = {
    total_conversations: conversationStats?.total_conversations || 0,
    active_conversations: conversationStats?.active_conversations || 0,
    completed_conversations: conversationStats?.completed_conversations || 0,
    total_messages: conversationStats?.total_messages || 0,
    leads_captured: conversationStats?.leads_captured || 0,
    conversions: conversationStats?.conversions || 0,
    avg_satisfaction: conversationStats?.avg_satisfaction || null,
    conversion_rate: conversationStats?.total_conversations > 0
      ? (conversationStats.conversions / conversationStats.total_conversations) * 100
      : 0,
    avg_messages_per_conversation: conversationStats?.total_conversations > 0
      ? conversationStats.total_messages / conversationStats.total_conversations
      : 0,
    events_by_type: {} as Record<string, number>,
  };

  // Get event breakdown
  const events = await db
    .prepare(`
      SELECT event_type, COUNT(*) as count
      FROM ai_analytics_events
      WHERE assistant_id = ? ${timeFilter}
      GROUP BY event_type
    `)
    .bind(assistantId)
    .all();

  events.results.forEach((event: any) => {
    stats.events_by_type[event.event_type] = event.count;
  });

  return stats;
}

function getTimeFilter(timeRange: 'day' | 'week' | 'month' | 'all'): string {
  const now = new Date();
  let cutoff: Date;

  switch (timeRange) {
    case 'day':
      cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return '';
  }

  return `AND created_at >= '${cutoff.toISOString()}'`;
}
