-- Audience Growth Engine: flows, subscribers, events, OAuth state, rate limits
--
-- Required secrets (Cloudflare Worker):
--   AUDIENCE_GOOGLE_CLIENT_ID / AUDIENCE_GOOGLE_CLIENT_SECRET — visitor Google OAuth; authorize redirect
--     https://<your-worker-origin>/api/audience/oauth/google/callback in Google Cloud Console.
--   AUDIENCE_UNLOCK_SECRET — 32+ chars for HMAC-signed unlock JWTs (or rely on long MOCHA_USERS_SERVICE_API_KEY fallback).
--
-- Apply: wrangler d1 execute DB --file=./migrations/0002_audience_engine.sql --local|--remote

CREATE TABLE IF NOT EXISTS capture_flows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT 'Capture flow',
  status TEXT NOT NULL DEFAULT 'draft',
  asset_type TEXT NOT NULL,
  capture_method TEXT NOT NULL,
  config_json TEXT NOT NULL DEFAULT '{}',
  public_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_capture_flows_user ON capture_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_capture_flows_status ON capture_flows(user_id, status);

CREATE TABLE IF NOT EXISTS capture_flow_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  flow_id INTEGER NOT NULL,
  wordpress_site_id INTEGER,
  asset_key TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (flow_id) REFERENCES capture_flows(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_flow_targets_flow ON capture_flow_targets(flow_id);

CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  name TEXT,
  provider TEXT NOT NULL DEFAULT 'email',
  google_sub TEXT,
  source_asset_type TEXT,
  source_asset_key TEXT NOT NULL DEFAULT '',
  capture_flow_id INTEGER,
  traffic_source TEXT,
  wordpress_site_id INTEGER,
  engagement_score INTEGER NOT NULL DEFAULT 0,
  subscriber_tags TEXT NOT NULL DEFAULT '[]',
  conversion_time TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(owner_user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_subscribers_owner ON subscribers(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscribers_flow ON subscribers(capture_flow_id, created_at DESC);

CREATE TABLE IF NOT EXISTS capture_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  capture_flow_id INTEGER,
  subscriber_id INTEGER,
  asset_key TEXT NOT NULL DEFAULT '',
  wordpress_site_id INTEGER,
  meta_json TEXT,
  session_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_capture_events_owner_time ON capture_events(owner_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_capture_events_type ON capture_events(owner_user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_capture_events_flow ON capture_events(capture_flow_id, created_at);

CREATE TABLE IF NOT EXISTS subscriber_unlock_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subscriber_id INTEGER NOT NULL,
  capture_flow_id INTEGER NOT NULL,
  asset_key TEXT NOT NULL DEFAULT '',
  unlock_method TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (subscriber_id) REFERENCES subscribers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_unlock_subscriber ON subscriber_unlock_history(subscriber_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audience_oauth_states (
  state TEXT PRIMARY KEY,
  flow_public_id TEXT NOT NULL,
  return_url TEXT NOT NULL,
  owner_user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audience_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hit_count INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audience_exchange_codes (
  code TEXT PRIMARY KEY,
  subscriber_id INTEGER NOT NULL,
  flow_public_id TEXT NOT NULL,
  owner_user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
