export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
  };

  const { user_id, share_target, share_type } = req.body;
  if (!user_id || !share_target || !share_type) {
    return res.status(400).json({ error: "user_id, share_target, share_type required" });
  }

  const POINTS = { x: 30, instagram: 30, line: 10 };
  const DAILY_LIMITS = { x: 1, instagram: 1, line: 3 };
  const points = POINTS[share_target] || 0;
  const limit = DAILY_LIMITS[share_target] || 1;

  // 今日の日付範囲でシェアログを取得
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const logRes = await fetch(
    `${SUPABASE_URL}/rest/v1/share_logs?user_id=eq.${user_id}&share_target=eq.${share_target}&created_at=gte.${todayStart.toISOString()}&created_at=lte.${todayEnd.toISOString()}&select=id`,
    { headers }
  );
  const logs = await logRes.json();
  const todayCount = Array.isArray(logs) ? logs.length : 0;

  const insertLog = async (pts) => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/share_logs`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id, share_target, share_type, points_awarded: pts }),
    });
    if (!r.ok) {
      const body = await r.text();
      console.error(`[share.js] INSERT share_logs failed: ${r.status} ${body}`);
    }
  };

  if (todayCount >= limit) {
    await insertLog(0);
    return res.status(200).json({ awarded: false, points: 0, reason: "already_claimed_today" });
  }

  // ポイント加算
  await insertLog(points);

  // user_pointsに加算
  const fetchPts = await fetch(
    `${SUPABASE_URL}/rest/v1/user_points?user_id=eq.${user_id}&select=balance`,
    { headers }
  );
  const rows = await fetchPts.json();

  let newBalance;
  if (Array.isArray(rows) && rows[0]) {
    newBalance = (rows[0].balance || 0) + points;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_points?user_id=eq.${user_id}`, {
      method: "PATCH",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ balance: newBalance, updated_at: new Date().toISOString() }),
    });
    if (!r.ok) console.error(`[share.js] PATCH user_points failed: ${r.status} ${await r.text()}`);
  } else {
    newBalance = points;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/user_points`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=representation" },
      body: JSON.stringify({ user_id, balance: newBalance }),
    });
    if (!r.ok) console.error(`[share.js] POST user_points failed: ${r.status} ${await r.text()}`);
  }

  return res.status(200).json({ awarded: true, points, balance: newBalance });
}
