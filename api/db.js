// Serverless KV Database helper for Vercel KV / Upstash Redis

async function getKV(key) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  try {
    const res = await fetch(`${url}/get/${key}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    if (data && data.result) {
      return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
    }
  } catch (err) {
    console.error(`KV GET error for key ${key}:`, err);
  }
  return null;
}

async function setKV(key, value) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return false;

  try {
    const res = await fetch(`${url}/set/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(typeof value === 'string' ? value : JSON.stringify(value))
    });
    const data = await res.json();
    return data && data.result === 'OK';
  } catch (err) {
    console.error(`KV SET error for key ${key}:`, err);
  }
  return false;
}

module.exports = { getKV, setKV };
