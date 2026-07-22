// Serverless Redis Database helper for Vercel Redis / Upstash Redis

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

  return { url, token };
}

async function getKV(key) {
  const { url, token } = getCredentials();
  if (!url || !token) {
    console.warn(`[Redis DB] Credentials missing for GET ${key}`);
    return null;
  }

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
    console.error(`[Redis DB] GET error for key ${key}:`, err);
  }
  return null;
}

async function setKV(key, value) {
  const { url, token } = getCredentials();
  if (!url || !token) {
    console.warn(`[Redis DB] Credentials missing for SET ${key}`);
    return false;
  }

  const strValue = typeof value === 'string' ? value : JSON.stringify(value);

  try {
    // Try Upstash / Vercel Redis POST endpoint
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

    // Command array fallback if REST endpoint expects array command
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
    console.error(`[Redis DB] SET error for key ${key}:`, err);
  }
  return false;
}

module.exports = { getKV, setKV };
