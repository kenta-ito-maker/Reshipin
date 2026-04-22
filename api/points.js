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
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_points?user_id=eq.${user_id}&select=balance`, { headers });
    const rows = await r.json();
    const balance = Array.isArray(rows) && rows[0] ? rows[0].balance : 0;
    return res.status(200).json({ user_id, balance });
  }

  if (req.method === "POST") {
    const { user_id, amount } = req.body;
    if (!user_id || typeof amount !== "number") return res.status(400).json({ error: "user_id and amount required" });

    // 既存レコード確認
    const fetchRes = await fetch(`${SUPABASE_URL}/rest/v1/user_points?user_id=eq.${user_id}&select=balance`, { headers });
    const rows = await fetchRes.json();

    if (Array.isArray(rows) && rows[0]) {
      const newBalance = (rows[0].balance || 0) + amount;
      const r = await fetch(`${SUPABASE_URL}/rest/v1/user_points?user_id=eq.${user_id}`, {
        method: "PATCH",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
      });
      const data = await r.json();
      return res.status(200).json({ user_id, balance: Array.isArray(data) && data[0] ? data[0].balance : newBalance });
    } else {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/user_points`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=representation" },
        body: JSON.stringify({ user_id, balance: amount }),
      });
      const data = await r.json();
      return res.status(200).json({ user_id, balance: Array.isArray(data) && data[0] ? data[0].balance : amount });
    }
  }

  res.status(405).end();
}
