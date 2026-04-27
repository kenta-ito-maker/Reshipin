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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/weekly_plans?user_id=eq.${user_id}&order=created_at.desc&limit=1`, { headers });
    const rows = await r.json();
    return res.status(200).json(Array.isArray(rows) && rows[0] ? rows[0] : null);
  }

  if (req.method === "POST") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/weekly_plans`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[weekly-plan.js] POST failed: ${r.status} ${body}`);
      return res.status(r.status).json({ error: body });
    }
    const data = await r.json();
    return res.status(200).json(Array.isArray(data) ? data[0] : data);
  }

  res.status(405).end();
}
