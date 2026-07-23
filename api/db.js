// Serverless Multi-Provider DB helper (Upstash Redis, Firebase, and Pre-configured Cloud DB)

const DEFAULT_BLOBS = {
  zutere_quotes_history: 'https://jsonblob.com/api/jsonBlob/019f8cb5-f28a-7ea2-bdfb-f68972229e44',
  zutere_site_data: 'https://jsonblob.com/api/jsonBlob/019f8cbc-2756-7e2e-8890-7e21ba385e7e',
  zutere_catalog_services: 'https://jsonblob.com/api/jsonBlob/019f8cbc-4626-713d-b3f6-2a045c8c5f63',
  zutere_company_info: 'https://jsonblob.com/api/jsonBlob/019f8cbc-62cb-7461-b468-b8041ebefe95'
};

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

  // 1. Firebase Realtime DB (If configured)
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

  // 2. Upstash Redis / Vercel Redis (If configured)
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

  // 3. Pre-configured Persistent Cloud DB (Zero setup required)
  const blobUrl = DEFAULT_BLOBS[key];
  if (blobUrl) {
    try {
      const res = await fetch(blobUrl, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        return data !== null ? data : null;
      }
    } catch (e) {
      console.error(`[Pre-configured Cloud DB] GET error for ${key}:`, e);
    }
  }

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

  // 3. Pre-configured Persistent Cloud DB (Zero setup required)
  const blobUrl = DEFAULT_BLOBS[key];
  if (blobUrl) {
    try {
      const res = await fetch(blobUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(value)
      });
      return res.ok;
    } catch (e) {
      console.error(`[Pre-configured Cloud DB] SET error for ${key}:`, e);
    }
  }

  return false;
}

module.exports = { getKV, setKV };
