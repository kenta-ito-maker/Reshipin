export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  const { table, data } = req.body;
  if (!table || !data) return res.status(400).json({ error: "table and data required" });

  const allowed = ["analyze_logs", "chip_logs"];
  if (!allowed.includes(table)) return res.status(400).json({ error: "invalid table" });

  await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  return res.status(200).json({ success: true });
}
