export async function onRequest(context) {
  if (!context) return new Response("No context", { status: 500 });
  const { request, env } = context;
  if (!request) return new Response("No request", { status: 500 });
  
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Helper to return JSON
  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }});
  }

  try {
    if (!env || !env.db) {
      return jsonResponse({ 
        error: "D1 Datenbank 'db' ist nicht gebunden oder 'env' ist nicht verfügbar. Bitte prüfe deine Cloudflare Pages Einstellungen (Bindings)." 
      }, 500);
    }

    // --- ENTRIES ENDPOINTS ---
    if (path === '/api/entries') {
      if (method === 'GET') {
        const { results } = await env.db.prepare("SELECT * FROM entries ORDER BY date DESC").all();
        const entries = results.map(row => {
          let splits = { med: 0, bau: 0, cursum: 0, talentzio: 0 };
          let comments = { med: '', bau: '', cursum: '', talentzio: '' };
          
          try {
            if (row.splits) splits = JSON.parse(row.splits);
            else {
              splits = {
                med: row.med_hours || 0,
                bau: row.bau_hours || 0,
                cursum: row.cursum_hours || 0,
                talentzio: (row.totalHours || 0) - ((row.med_hours || 0) + (row.bau_hours || 0) + (row.cursum_hours || 0))
              };
            }
          } catch (e) { console.error("Error parsing splits", e); }

          try {
            if (row.comments) comments = JSON.parse(row.comments);
            else {
              comments = {
                med: row.med_notes || '',
                bau: row.bau_notes || '',
                cursum: row.cursum_notes || '',
                talentzio: ''
              };
            }
          } catch (e) { console.error("Error parsing comments", e); }

          return {
            ...row,
            isLocked: Boolean(row.isLocked),
            isDraft: row.isDraft === 'ENTWURF' || row.isDraft === 'DRAFT' || row.isDraft === 1 || row.isDraft === true || row.isDraft === 'true' || row.isDraft === '1',
            splits,
            comments
          };
        });
        return jsonResponse(entries);
      }
      
      if (method === 'POST') {
        const entry = await request.json();
        await env.db.prepare(`
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
        `).bind(
          entry.id, entry.date, entry.startM, entry.lunch, entry.startN, entry.end,
          entry.note, entry.totalHours, entry.isLocked ? 1 : 0,
          (entry.isDraft === true || entry.isDraft === 'ENTWURF' || entry.isDraft === 'DRAFT') ? 'ENTWURF' : 'CONFIRMED',
          JSON.stringify(entry.splits), JSON.stringify(entry.comments),
          entry.splits.cursum || 0, entry.comments.cursum || '',
          entry.splits.med || 0, entry.comments.med || '',
          entry.splits.bau || 0, entry.comments.bau || ''
        ).run();
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/entries/')) {
      const id = path.split('/').pop();
      
      if (method === 'DELETE') {
        await env.db.prepare("DELETE FROM entries WHERE id = ?").bind(id).run();
        return new Response(null, { status: 204 });
      }
    }

    // --- SETTINGS ENDPOINTS ---
    if (path === '/api/settings') {
      if (method === 'GET') {
        const result = await env.db.prepare("SELECT value FROM settings WHERE key = 'user_settings'").first();
        return jsonResponse(result ? JSON.parse(result.value) : null);
      }
      if (method === 'POST') {
        const settings = await request.json();
        await env.db.prepare("INSERT INTO settings (key, value) VALUES ('user_settings', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
          .bind(JSON.stringify(settings)).run();
        return jsonResponse({ success: true });
      }
    }

    // --- BULK OPERATIONS ---
    if (path === '/api/entries/bulk-lock' && method === 'POST') {
      const { startDate, endDate, lock } = await request.json();
      await env.db.prepare("UPDATE entries SET isLocked = ? WHERE date >= ? AND date <= ?")
        .bind(lock ? 1 : 0, startDate, endDate).run();
      return jsonResponse({ success: true });
    }

    // --- NOTIFICATIONS ENDPOINTS ---
    if (path === '/api/notifications') {
      if (method === 'GET') {
        const { results } = await env.db.prepare("SELECT * FROM notifications ORDER BY timestamp DESC").all();
        const notifications = results.map(row => ({
          ...row,
          isRead: Boolean(row.isRead),
          data: row.data ? JSON.parse(row.data) : null
        }));
        return jsonResponse(notifications);
      }
      if (method === 'POST') {
        const n = await request.json();
        await env.db.prepare(`
          INSERT INTO notifications (id, type, title, message, timestamp, isRead, data)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            type=excluded.type, title=excluded.title, message=excluded.message,
            timestamp=excluded.timestamp, isRead=excluded.isRead, data=excluded.data
        `).bind(
          n.id, n.type, n.title, n.message, n.timestamp, n.isRead ? 1 : 0,
          n.data ? JSON.stringify(n.data) : null
        ).run();
        return jsonResponse({ success: true }, 201);
      }
    }

    if (path.startsWith('/api/notifications/')) {
      const id = path.split('/').pop();
      if (method === 'DELETE') {
        await env.db.prepare("DELETE FROM notifications WHERE id = ?").bind(id).run();
        return new Response(null, { status: 204 });
      }
    }

    return new Response("Not Found", { status: 404 });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}
