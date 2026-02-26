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
  isDraft TEXT DEFAULT 'REAL',
  splits TEXT, -- Stored as JSON string (keeping for compatibility)
  comments TEXT, -- Stored as JSON string (keeping for compatibility)
  cursum_hours REAL,
  cursum_notes TEXT,
  med_hours REAL,
  med_notes TEXT,
  bau_hours REAL,
  bau_notes TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT,
  title TEXT,
  message TEXT,
  timestamp TEXT,
  isRead INTEGER DEFAULT 0,
  data TEXT -- JSON string
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
