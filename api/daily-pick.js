export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  // JST (UTC+9) で今日の日付を取得
  const now = new Date(); now.setHours(now.getHours() + 9);
  const today = now.toISOString().split("T")[0];

  if (req.method === "GET") {
    // 今日のピックを取得
    const r = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?pick_date=eq.${today}&limit=1`, { headers });
    const rows = await r.json();
    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(200).json(rows[0]);
    }
    return res.status(200).json(null);
  }

  if (req.method === "POST") {
    // AI生成結果を保存
    const { recipe_name, recipe_data, theme } = req.body;
    if (!recipe_name) return res.status(400).json({ error: "recipe_name required" });

    // 既に今日のピックがあれば返す（重複防止）
    const check = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks?pick_date=eq.${today}&limit=1`, { headers });
    const existing = await check.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(200).json(existing[0]);
    }

    console.log(`[daily-pick.js] Saving: name=${recipe_name}, theme=${theme}, data_keys=${recipe_data ? Object.keys(recipe_data).join(",") : "null"}`);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/daily_picks`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ pick_date: today, recipe_name, recipe_data: recipe_data || {}, theme: theme || null }),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[daily-pick.js] POST failed: ${r.status} ${body}`);
      return res.status(r.status).json({ error: body });
    }
    const data = await r.json();
    return res.status(200).json(Array.isArray(data) ? data[0] : data);
  }

  res.status(405).end();
}
