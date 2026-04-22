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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory?user_id=eq.${user_id}&order=expiry.asc.nullslast`, { headers });
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${id}`, { method: "DELETE", headers });
    return res.status(200).json({ success: true });
  }

  if (req.method === "PATCH") {
    const { id } = req.query;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    return res.status(200).json(data);
  }

  res.status(405).end();
}
