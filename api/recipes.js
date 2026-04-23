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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/saved_recipes?user_id=eq.${user_id}&order=saved_at.desc`, { headers });
    return res.status(200).json(await r.json());
  }

  if (req.method === "POST") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/saved_recipes`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    return res.status(200).json(await r.json());
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    await fetch(`${SUPABASE_URL}/rest/v1/saved_recipes?id=eq.${id}`, { method: "DELETE", headers });
    return res.status(200).json({ success: true });
  }

  res.status(405).end();
}
