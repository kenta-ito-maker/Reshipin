export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  const { user_id, recipe_name, recipe_data } = req.body;
  if (!user_id || !recipe_name) {
    return res.status(400).json({ error: "user_id and recipe_name required" });
  }

  const r = await fetch(`${SUPABASE_URL}/rest/v1/rejected_logs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id, recipe_name, recipe_data: recipe_data || {} }),
  });

  if (!r.ok) {
    const body = await r.text();
    console.error(`[rejected.js] INSERT failed: ${r.status} ${body}`);
    return res.status(r.status).json({ error: body });
  }

  return res.status(200).json({ success: true });
}
