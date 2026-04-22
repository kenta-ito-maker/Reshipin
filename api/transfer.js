// api/transfer.js - 引き継ぎコードの発行・取得
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

async function sb(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const { code, user_id } = req.body || {};
      if (!code || !user_id) return res.status(400).json({ error: "code and user_id required" });
      const rows = await sb("/transfer_codes", {
        method: "POST",
        body: JSON.stringify({ code, user_id }),
      });
      const row = Array.isArray(rows) ? rows[0] : rows;
      return res.status(200).json({ code: row?.code || code });
    }

    if (req.method === "GET") {
      const { code } = req.query || {};
      if (!code) return res.status(400).json({ error: "code required" });
      const rows = await sb(`/transfer_codes?code=eq.${encodeURIComponent(code)}&select=user_id`);
      if (!Array.isArray(rows) || rows.length === 0) return res.status(404).json({ error: "not found" });
      return res.status(200).json({ user_id: rows[0].user_id });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
