const { getKV, setKV } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const KEY = 'zutere_site_data';

  if (req.method === 'GET') {
    const data = await getKV(KEY);
    return res.status(200).json({ success: true, data: data || null });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const siteData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const saved = await setKV(KEY, siteData);
      return res.status(200).json({ success: true, cloudSaved: saved, data: siteData });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid payload' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
