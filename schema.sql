-- SQL Schema for Cloudflare D1

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  startM TEXT,
  lunch TEXT,
  startN TEXT,
  end TEXT,
  note TEXT,
  totalHours REAL,
  isLocked INTEGER DEFAULT 0,
  splits TEXT, -- Stored as JSON string
  comments TEXT -- Stored as JSON string
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
