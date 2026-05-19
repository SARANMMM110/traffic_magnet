-- AI Assistant Studio: assistants, conversations, messages, analytics, deployments, sessions
--
-- Apply: wrangler d1 execute DB --file=./migrations/0003_ai_assistants.sql --local|--remote

CREATE TABLE IF NOT EXISTS ai_assistants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'AI Assistant',
  status TEXT NOT NULL DEFAULT 'draft',
  assistant_type TEXT NOT NULL DEFAULT 'lead-capture',
  target_goal TEXT,
  personality TEXT DEFAULT 'professional',
  tone TEXT DEFAULT 'helpful',
  expertise_areas TEXT,
  instructions TEXT,
  context_data TEXT NOT NULL DEFAULT '{}',
  knowledge_sources TEXT NOT NULL DEFAULT '[]',
  engagement_settings TEXT NOT NULL DEFAULT '{}',
  trigger_config TEXT NOT NULL DEFAULT '{}',
  deployment_config TEXT NOT NULL DEFAULT '{}',
  capture_flow_public_id TEXT,
  linked_tool_id INTEGER,
  linked_project_id INTEGER,
  asset_type TEXT,
  asset_key TEXT NOT NULL DEFAULT '',
  niche TEXT,
  monetization_goal TEXT,
  theme TEXT NOT NULL DEFAULT 'violet',
  widget_position TEXT NOT NULL DEFAULT 'bottom-right',
  total_conversations INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  conversion_rate REAL NOT NULL DEFAULT 0,
  avg_satisfaction_score REAL,
  engagement_score REAL NOT NULL DEFAULT 0,
  lead_influence_count INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_assistants_user ON ai_assistants(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_assistants_status ON ai_assistants(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_assistants_public ON ai_assistants(public_id);

CREATE TABLE IF NOT EXISTS assistant_deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assistant_id INTEGER NOT NULL,
  deployment_target TEXT NOT NULL,
  asset_type TEXT,
  asset_key TEXT NOT NULL DEFAULT '',
  wordpress_site_id INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  config_json TEXT NOT NULL DEFAULT '{}',
  deployed_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assistant_deployments_assistant ON assistant_deployments(assistant_id);

CREATE TABLE IF NOT EXISTS assistant_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assistant_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  visitor_hash TEXT,
  conversation_id INTEGER,
  pages_viewed TEXT NOT NULL DEFAULT '[]',
  last_page TEXT,
  meta_json TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assistant_sessions_token ON assistant_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_assistant ON assistant_sessions(assistant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assistant_id INTEGER NOT NULL,
  user_id TEXT,
  visitor_session_hash TEXT,
  session_id INTEGER,
  conversation_status TEXT NOT NULL DEFAULT 'active',
  total_messages INTEGER NOT NULL DEFAULT 0,
  lead_captured INTEGER NOT NULL DEFAULT 0,
  conversion_achieved INTEGER NOT NULL DEFAULT 0,
  lead_email TEXT,
  lead_name TEXT,
  satisfaction_score INTEGER,
  engagement_duration_ms INTEGER,
  intent_signals TEXT,
  conversation_data TEXT,
  meta_json TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_assistant ON ai_conversations(assistant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);

CREATE TABLE IF NOT EXISTS ai_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  assistant_id INTEGER NOT NULL,
  message_role TEXT NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT,
  attachment_data TEXT,
  response_time_ms INTEGER,
  token_count INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS ai_analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assistant_id INTEGER NOT NULL,
  conversation_id INTEGER,
  user_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT,
  event_value REAL,
  event_meta TEXT,
  session_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_assistant_time ON ai_analytics_events(assistant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_type ON ai_analytics_events(assistant_id, event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS assistant_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hit_count INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);
