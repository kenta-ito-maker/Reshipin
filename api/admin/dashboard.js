export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const ADMIN_IDS = ["user_paxjzcfowa1776878644247"];
  const uid = req.query.user_id;
  if (!uid || !ADMIN_IDS.includes(uid)) return res.status(403).json({ error: "forbidden" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
  const headers = { "Content-Type": "application/json", "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` };

  const period = req.query.period || "30"; // "1", "7", "30", "all"
  const now = new Date();
  const since = period === "all" ? new Date("2020-01-01") : new Date(now - parseInt(period) * 86400000);
  const sinceISO = since.toISOString();

  const sb = async (table, query = "") => {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, { headers });
    return r.json();
  };

  try {
    // --- Users ---
    const allPoints = await sb("user_points", "?select=user_id,updated_at");
    const totalUsers = Array.isArray(allPoints) ? allPoints.length : 0;

    const day1ago = new Date(now - 86400000).toISOString();
    const day30ago = new Date(now - 30 * 86400000).toISOString();
    const day7ago = new Date(now - 7 * 86400000).toISOString();

    // DAU/MAU from analyze_logs
    const recentAnalyze = await sb("analyze_logs", `?select=user_id,created_at&created_at=gte.${day30ago}&order=created_at.desc&limit=5000`);
    const analyzeArr = Array.isArray(recentAnalyze) ? recentAnalyze : [];

    const dauSet = new Set(analyzeArr.filter(a => a.created_at >= day1ago).map(a => a.user_id));
    const mauSet = new Set(analyzeArr.map(a => a.user_id));

    // New users (from user_points created recently - approximate)
    const allPtsArr = Array.isArray(allPoints) ? allPoints : [];
    const new7 = allPtsArr.filter(u => u.updated_at && u.updated_at >= day7ago).length;
    const new30 = allPtsArr.filter(u => u.updated_at && u.updated_at >= day30ago).length;

    // --- Activity (within period) ---
    const periodAnalyze = await sb("analyze_logs", `?select=id&created_at=gte.${sinceISO}&limit=10000`);
    const periodCooked = await sb("cooked_logs", `?select=id&created_at=gte.${sinceISO}&limit=10000`);
    const periodShares = await sb("share_logs", `?select=share_target&created_at=gte.${sinceISO}&limit=10000`);

    const sharesArr = Array.isArray(periodShares) ? periodShares : [];
    const shareCounts = { x: 0, instagram: 0, line: 0, total: sharesArr.length };
    sharesArr.forEach(s => { if (shareCounts[s.share_target] !== undefined) shareCounts[s.share_target]++; });

    // --- Popular ingredients ---
    const invAll = await sb("inventory", `?select=name,user_id&limit=5000`);
    const invArr = Array.isArray(invAll) ? invAll : [];
    const ingMap = {};
    invArr.forEach(i => {
      if (!ingMap[i.name]) ingMap[i.name] = new Set();
      ingMap[i.name].add(i.user_id);
    });
    const popularIngredients = Object.entries(ingMap)
      .map(([name, users]) => ({ name, user_count: users.size }))
      .sort((a, b) => b.user_count - a.user_count)
      .slice(0, 10);

    // --- Popular recipes ---
    const cookedAll = await sb("cooked_logs", `?select=recipe_name&created_at=gte.${sinceISO}&limit=5000`);
    const cookedArr = Array.isArray(cookedAll) ? cookedAll : [];
    const recipeMap = {};
    cookedArr.forEach(c => { recipeMap[c.recipe_name] = (recipeMap[c.recipe_name] || 0) + 1; });
    const popularRecipes = Object.entries(recipeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // --- Mood chips ---
    const chipAll = await sb("chip_logs", `?select=chips&created_at=gte.${sinceISO}&limit=5000`);
    const chipArr = Array.isArray(chipAll) ? chipAll : [];
    const chipMap = {};
    let chipTotal = 0;
    chipArr.forEach(c => {
      if (Array.isArray(c.chips)) {
        c.chips.forEach(ch => { chipMap[ch] = (chipMap[ch] || 0) + 1; chipTotal++; });
      }
    });
    const moodChips = Object.entries(chipMap)
      .map(([name, count]) => ({ name, percentage: chipTotal ? Math.round(count / chipTotal * 100) : 0 }))
      .sort((a, b) => b.percentage - a.percentage);

    return res.status(200).json({
      users: { total: totalUsers, dau: dauSet.size, mau: mauSet.size, new_7days: new7, new_30days: new30 },
      activity: {
        analyze_count: Array.isArray(periodAnalyze) ? periodAnalyze.length : 0,
        cooked_count: Array.isArray(periodCooked) ? periodCooked.length : 0,
        share_count: shareCounts,
      },
      popular: { ingredients: popularIngredients, recipes: popularRecipes },
      mood_chips: moodChips,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
