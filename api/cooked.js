export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  if (req.method === "GET") {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id required" });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cooked_logs?user_id=eq.${user_id}&order=cooked_at.desc&limit=50`, { headers });
    return res.status(200).json(await r.json());
  }

  if (req.method === "POST") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cooked_logs`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[cooked.js] POST failed: ${r.status} ${body}`);
    }
    return res.status(200).json(await r.json());
  }

  if (req.method === "PATCH") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "id required" });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cooked_logs?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[cooked.js] PATCH failed: ${r.status} ${body}`);
    }
    return res.status(200).json(await r.json());
  }

  res.status(405).end();
}
