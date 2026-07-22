const { getKV, setKV } = require('./db');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const KEY = 'zutere_quotes_history';

  if (req.method === 'GET') {
    const data = await getKV(KEY);
    return res.status(200).json({ success: true, data: data || [] });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const quotes = Array.isArray(body) ? body : (body.quotes || []);
      const saved = await setKV(KEY, quotes);
      return res.status(200).json({ success: true, cloudSaved: saved, data: quotes });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
