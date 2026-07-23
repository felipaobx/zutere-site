// Serverless Single/Multi-Provider DB helper

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

  // 1. Upstash Redis / Vercel Redis (If configured)
  if (url && token) {
    try {
      const res = await fetch(`${url}/get/${key}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.result !== undefined && data.result !== null) {
        let resVal = data.result;
        if (typeof resVal === 'string') {
          try { resVal = JSON.parse(resVal); } catch (e) {}
        }
        if (resVal && typeof resVal === 'object' && Object.keys(resVal).length > 0) {
          return resVal;
        }
      }
    } catch (err) {
      console.error(`[Redis DB] GET error for ${key}:`, err);
    }
  }

  // 2. Firebase Realtime DB (If configured)
  if (firebaseUrl) {
    try {
      const cleanUrl = firebaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/${key}.json`);
      const data = await res.json();
      if (data !== null && typeof data === 'object' && Object.keys(data).length > 0) {
        return data;
      }
    } catch (e) {
      console.error(`[Firebase DB] GET error for ${key}:`, e);
    }
  }

  // 3. Persistent Cloud DB (JsonBlob)
  const blobUrl = DEFAULT_BLOBS[key];
  if (blobUrl) {
    try {
      const res = await fetch(blobUrl, {
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data !== null && typeof data === 'object') {
          return data;
        }
      }
    } catch (e) {
      console.error(`[Persistent Cloud DB] GET error for ${key}:`, e);
    }
  }

  return null;
}

async function setKV(key, value) {
  const { url, token, firebaseUrl } = getCredentials();
  let success = false;

  // 1. Upstash Redis / Vercel Redis
  if (url && token) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['SET', key, strValue])
      });
      const data = await res.json();
      if (data && (data.result === 'OK' || data.result === 'ok' || data.result !== undefined)) {
        success = true;
      }
    } catch (err) {
      console.error(`[Redis DB] SET error for ${key}:`, err);
    }
  }

  // 2. Firebase Realtime DB
  if (firebaseUrl) {
    try {
      const cleanUrl = firebaseUrl.replace(/\/$/, '');
      const res = await fetch(`${cleanUrl}/${key}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      if (res.ok) success = true;
    } catch (e) {
      console.error(`[Firebase DB] SET error for ${key}:`, e);
    }
  }

  // 3. Persistent Cloud DB (JsonBlob)
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
      if (res.ok) success = true;
    } catch (e) {
      console.error(`[Persistent Cloud DB] SET error for ${key}:`, e);
    }
  }

  return success;
}

module.exports = { getKV, setKV };
