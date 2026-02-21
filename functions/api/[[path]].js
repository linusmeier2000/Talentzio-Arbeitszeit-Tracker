export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Helper to return JSON
  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  try {
    // --- ENTRIES ENDPOINTS ---
    if (path === '/api/entries') {
      if (method === 'GET') {
        const { results } = await env.DB.prepare("SELECT * FROM entries ORDER BY date DESC").all();
        const entries = results.map(row => ({
          ...row,
          isLocked: Boolean(row.isLocked),
          splits: JSON.parse(row.splits),
          comments: JSON.parse(row.comments)
        }));
        return jsonResponse(entries);
      }
      
      if (method === 'POST') {
        const entry = await request.json();
        await env.DB.prepare(`
          INSERT INTO entries (id, date, startM, lunch, startN, end, note, totalHours, isLocked, splits, comments)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            date=excluded.date, startM=excluded.startM, lunch=excluded.lunch, startN=excluded.startN,
            end=excluded.end, note=excluded.note, totalHours=excluded.totalHours,
            isLocked=excluded.isLocked, splits=excluded.splits, comments=excluded.comments
        `).bind(
          entry.id, entry.date, entry.startM, entry.lunch, entry.startN, entry.end,
          entry.note, entry.totalHours, entry.isLocked ? 1 : 0,
          JSON.stringify(entry.splits), JSON.stringify(entry.comments)
        ).run();
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/entries/')) {
      const id = path.split('/').pop();
      
      if (method === 'DELETE') {
        await env.DB.prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
        return new Response(null, { status: 204 });
      }
    }

    // --- SETTINGS ENDPOINTS ---
    if (path === '/api/settings') {
      if (method === 'GET') {
        const result = await env.DB.prepare("SELECT value FROM settings WHERE key = 'user_settings'").first();
        return jsonResponse(result ? JSON.parse(result.value) : null);
      }
      if (method === 'POST') {
        const settings = await request.json();
        await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('user_settings', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
          .bind(JSON.stringify(settings)).run();
        return jsonResponse({ success: true });
      }
    }

    // --- BULK OPERATIONS ---
    if (path === '/api/entries/bulk-lock' && method === 'POST') {
      const { startDate, endDate, lock } = await request.json();
      await env.DB.prepare("UPDATE entries SET isLocked = ? WHERE date >= ? AND date <= ?")
        .bind(lock ? 1 : 0, startDate, endDate).run();
      return jsonResponse({ success: true });
    }

    return new Response("Not Found", { status: 404 });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
