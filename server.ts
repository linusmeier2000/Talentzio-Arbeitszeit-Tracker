import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize local database
  const db = new Database("local.db");
  
  // Create tables if they don't exist (using the schema)
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  db.exec(schema);

  // Migration: Ensure isDraft column exists (for existing databases)
  try {
    db.prepare("ALTER TABLE entries ADD COLUMN isDraft TEXT DEFAULT 'REAL'").run();
    console.log("[DB] Added isDraft column to entries table");
  } catch (e) {
    // Column already exists or other error
  }

  app.use(express.json());

  // Logging Middleware
  app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
  });

  // --- API ROUTES (Mimicking Cloudflare D1 Function) ---

  app.get("/api/entries", (req, res) => {
    if (!db) return res.status(500).json({ error: "Datenbank nicht initialisiert" });
    try {
      const rows = db.prepare("SELECT * FROM entries ORDER BY date DESC").all() as any[];
      const entries = rows.map(row => {
        const { isLocked, isDraft, ...rest } = row;
        return {
          ...rest,
          isLocked: row.isLocked === 1 || row.isLocked === true || row.isLocked === '1' || row.isLocked === 'true',
          isDraft: row.isDraft === 'ENTWURF' || row.isDraft === 'DRAFT' || row.isDraft === 1 || row.isDraft === true || row.isDraft === 'true' || row.isDraft === '1',
          splits: row.splits ? JSON.parse(row.splits) : {
            med: row.med_hours || 0,
            bau: row.bau_hours || 0,
            cursum: row.cursum_hours || 0,
            talentzio: row.totalHours - ((row.med_hours || 0) + (row.bau_hours || 0) + (row.cursum_hours || 0))
          },
          comments: row.comments ? JSON.parse(row.comments) : {
            med: row.med_notes || '',
            bau: row.bau_notes || '',
            cursum: row.cursum_notes || '',
            talentzio: ''
          }
        };
      });
      res.json(entries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/entries", (req, res) => {
    console.log("POST /api/entries", req.body);
    if (!db) return res.status(500).json({ error: "Datenbank nicht initialisiert" });
    try {
      const entry = req.body;
      if (!entry || !entry.id || !entry.date) {
        return res.status(400).json({ error: "Ungültige Daten: ID und Datum erforderlich" });
      }
      const stmt = db.prepare(`
        INSERT INTO entries (
          id, date, startM, lunch, startN, end, note, totalHours, isLocked, isDraft, splits, comments,
          cursum_hours, cursum_notes, med_hours, med_notes, bau_hours, bau_notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          date=excluded.date, startM=excluded.startM, lunch=excluded.lunch, startN=excluded.startN,
          end=excluded.end, note=excluded.note, totalHours=excluded.totalHours,
          isLocked=excluded.isLocked, isDraft=excluded.isDraft, splits=excluded.splits, comments=excluded.comments,
          cursum_hours=excluded.cursum_hours, cursum_notes=excluded.cursum_notes,
          med_hours=excluded.med_hours, med_notes=excluded.med_notes,
          bau_hours=excluded.bau_hours, bau_notes=excluded.bau_notes
      `);
      
      const isDraftVal = (entry.isDraft === true || entry.isDraft === 'ENTWURF' || entry.isDraft === 'DRAFT') ? 'ENTWURF' : 'CONFIRMED';
      const isLockedVal = (entry.isLocked === true || entry.isLocked === 1) ? 1 : 0;

      stmt.run(
        entry.id, entry.date, entry.startM, entry.lunch, entry.startN, entry.end,
        entry.note, entry.totalHours, isLockedVal, isDraftVal,
        JSON.stringify(entry.splits), JSON.stringify(entry.comments),
        entry.splits.cursum || 0, entry.comments.cursum || '',
        entry.splits.med || 0, entry.comments.med || '',
        entry.splits.bau || 0, entry.comments.bau || ''
      );
      res.status(201).json({ success: true });
    } catch (err: any) {
      console.error("Database error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/entries/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM entries WHERE id = ?").run(req.params.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/settings", (req, res) => {
    try {
      const result = db.prepare("SELECT value FROM settings WHERE key = 'user_settings'").get() as any;
      res.json(result ? JSON.parse(result.value) : null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/settings", (req, res) => {
    try {
      const settings = req.body;
      db.prepare("INSERT INTO settings (key, value) VALUES ('user_settings', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
        .run(JSON.stringify(settings));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/entries/bulk-lock", (req, res) => {
    try {
      const { startDate, endDate, lock } = req.body;
      db.prepare("UPDATE entries SET isLocked = ? WHERE date >= ? AND date <= ?")
        .run(lock ? 1 : 0, startDate, endDate);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/notifications", (req, res) => {
    try {
      const rows = db.prepare("SELECT * FROM notifications ORDER BY timestamp DESC").all() as any[];
      const notifications = rows.map(row => ({
        ...row,
        isRead: Boolean(row.isRead),
        data: row.data ? JSON.parse(row.data) : null
      }));
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/notifications", (req, res) => {
    try {
      const notification = req.body;
      const stmt = db.prepare(`
        INSERT INTO notifications (id, type, title, message, timestamp, isRead, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type=excluded.type, title=excluded.title, message=excluded.message,
          timestamp=excluded.timestamp, isRead=excluded.isRead, data=excluded.data
      `);
      stmt.run(
        notification.id, notification.type, notification.title, notification.message,
        notification.timestamp, notification.isRead ? 1 : 0,
        notification.data ? JSON.stringify(notification.data) : null
      );
      res.status(201).json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/notifications/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM notifications WHERE id = ?").run(req.params.id);
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
