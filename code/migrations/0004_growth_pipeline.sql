-- Growth Deployment Pipeline: unified deployment flows, runs, operational events
-- Apply: wrangler d1 execute DB --file=./migrations/0004_growth_pipeline.sql --local|--remote

CREATE TABLE IF NOT EXISTS growth_deployments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Growth deployment',
  status TEXT NOT NULL DEFAULT 'draft',
  deployment_state TEXT NOT NULL DEFAULT 'idle',
  asset_type TEXT NOT NULL,
  asset_key TEXT NOT NULL DEFAULT '',
  linked_tool_id INTEGER,
  linked_campaign_id INTEGER,
  html_snapshot TEXT,
  audience_flow_public_id TEXT,
  audience_capture_method TEXT,
  assistant_public_id TEXT,
  assistant_id INTEGER,
  wordpress_site_id INTEGER,
  publish_target TEXT NOT NULL DEFAULT 'export',
  analytics_enabled INTEGER NOT NULL DEFAULT 1,
  conversion_tracking_enabled INTEGER NOT NULL DEFAULT 1,
  optimization_enabled INTEGER NOT NULL DEFAULT 1,
  config_json TEXT NOT NULL DEFAULT '{}',
  performance_json TEXT NOT NULL DEFAULT '{}',
  last_deployed_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_growth_deployments_user ON growth_deployments(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_deployments_state ON growth_deployments(user_id, deployment_state);
CREATE INDEX IF NOT EXISTS idx_growth_deployments_public ON growth_deployments(public_id);

CREATE TABLE IF NOT EXISTS growth_deployment_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  deployment_id INTEGER NOT NULL,
  run_status TEXT NOT NULL DEFAULT 'running',
  current_step TEXT,
  steps_json TEXT NOT NULL DEFAULT '[]',
  output_html TEXT,
  error_message TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (deployment_id) REFERENCES growth_deployments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_growth_runs_deployment ON growth_deployment_runs(deployment_id, started_at DESC);

CREATE TABLE IF NOT EXISTS growth_pipeline_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  deployment_id INTEGER,
  deployment_public_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT,
  asset_key TEXT NOT NULL DEFAULT '',
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_growth_events_user_time ON growth_pipeline_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_growth_events_deployment ON growth_pipeline_events(deployment_id, created_at DESC);
