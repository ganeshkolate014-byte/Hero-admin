// api/heroslide/[slug].js

export default async function handler(req, res) {
  try {
    // 1️⃣ Allow only GET
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({
        success: false,
        error: 'Method Not Allowed'
      });
    }

    // 2️⃣ Get slug from URL
    const { slug } = req.query;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Missing slug'
      });
    }

    // 3️⃣ Upstream API (your original endpoint)
    const upstreamUrl = `https://hero-admin-omega.vercel.app/heroslide/${slug}`;

    // 4️⃣ Fetch RAW response (NO parsing)
    const upstreamRes = await fetch(upstreamUrl);

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({
        success: false,
        error: 'Upstream API error'
      });
    }

    const rawText = await upstreamRes.text(); // 🔥 REAL RAW JSON

    // 5️⃣ FORCE browser to treat it as JSON
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    // 6️⃣ Send EXACT raw JSON
    return res.status(200).send(rawText);

  } catch (error) {
    // 7️⃣ Safety fallback
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
