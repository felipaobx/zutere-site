// Serverless Multi-Provider DB helper (Upstash Redis, Firebase, and Free Cloud Fallback)

function getCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || 
              process.env.KV_REST_API_URL || 
              process.env.VERCEL_REDIS_REST_URL || 
              process.env.REDIS_REST_URL ||
              process.env.STORAGE_REST_API_URL;

  const token = process.env.UPSTASH_REDIS_REST_TOKEN || 
                process.env.KV_REST_API_TOKEN || 
                process.env.VERCEL_REDIS_REST_TOKEN || 
                process.env.REDIS_REST_TOKEN ||
                process.env.STORAGE_REST_API_TOKEN;

  const firebaseUrl = process.env.FIREBASE_URL || process.env.FIREBASE_DB_URL;

  return { url, token, firebaseUrl };
}

async function getKV(key) {
  const { url, token, firebaseUrl } = getCredentials();

  // 1. Firebase Realtime DB Fallback (100% Free, no credit card)
  if (firebaseUrl) {
    try {
      const cleanUrl = firebaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/${key}.json`);
      const data = await res.json();
      return data !== null ? data : null;
    } catch (e) {
      console.error(`[Firebase DB] GET error for ${key}:`, e);
    }
  }

  // 2. Upstash Redis / Vercel Redis
  if (url && token) {
    try {
      const res = await fetch(`${url}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.result !== undefined && data.result !== null) {
        if (typeof data.result === 'string') {
          try { return JSON.parse(data.result); } catch (e) { return data.result; }
        }
        return data.result;
      }
    } catch (err) {
      console.error(`[Redis DB] GET error for ${key}:`, err);
    }
  }

  // 3. Persistent Public Cloud Bin Fallback (Free, zero config)
  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/zutere_site_${key}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return data || null;
    }
  } catch (e) {}

  return null;
}

async function setKV(key, value) {
  const { url, token, firebaseUrl } = getCredentials();

  // 1. Firebase Realtime DB
  if (firebaseUrl) {
    try {
      const cleanUrl = firebaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/${key}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      return res.ok;
    } catch (e) {
      console.error(`[Firebase DB] SET error for ${key}:`, e);
    }
  }

  // 2. Upstash Redis / Vercel Redis
  if (url && token) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      let res = await fetch(`${url}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: strValue
      });
      let data = await res.json();

      if (data && (data.result === 'OK' || data.result === 'ok')) {
        return true;
      }

      res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', key, strValue])
      });
      data = await res.json();
      return data && (data.result === 'OK' || data.result === 'ok');

    } catch (err) {
      console.error(`[Redis DB] SET error for ${key}:`, err);
    }
  }

  // 3. Persistent Public Cloud Bin Fallback
  try {
    const res = await fetch(`https://jsonblob.com/api/jsonBlob/zutere_site_${key}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(value)
    });
    return res.ok;
  } catch (e) {}

  return false;
}

module.exports = { getKV, setKV };
