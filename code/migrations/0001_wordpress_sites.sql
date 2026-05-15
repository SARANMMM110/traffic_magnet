-- WordPress publishing destinations (run: wrangler d1 execute DB --file=./migrations/0001_wordpress_sites.sql --local|--remote)
CREATE TABLE IF NOT EXISTS wordpress_sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  username TEXT NOT NULL,
  credentials_encrypted TEXT NOT NULL,
  wp_user_id INTEGER,
  wp_display_name TEXT,
  wp_version TEXT,
  rest_ok INTEGER NOT NULL DEFAULT 1,
  publishing_access INTEGER NOT NULL DEFAULT 0,
  connection_health TEXT NOT NULL DEFAULT 'healthy',
  publishing_frequency TEXT NOT NULL DEFAULT 'manual',
  seo_sync_status TEXT NOT NULL DEFAULT 'synced',
  last_publish_at TEXT,
  last_verified_at TEXT,
  assets_deployed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_wordpress_sites_user ON wordpress_sites(user_id);
