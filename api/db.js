// MongoDB Serverless Database Helper for Zutere Audiovisual
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

function getMongoUri() {
  return process.env.MONGODB_URI || 
         process.env.MONGO_URI || 
         process.env.MONGODB_URL || 
         process.env.DATABASE_URL;
}

async function connectToDatabase() {
  const uri = getMongoUri();
  if (!uri) {
    return { client: null, db: null };
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(uri, {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();
    const dbName = process.env.MONGODB_DB || 'zutere_db';
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error('[MongoDB Connection Error]:', error);
    return { client: null, db: null };
  }
}

async function getKV(key) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      return null;
    }

    const collection = db.collection('app_state');
    const doc = await collection.findOne({ _id: key });

    if (doc && doc.value) {
      return doc.value;
    }
    return null;
  } catch (error) {
    console.error(`[MongoDB GET Error] Key: ${key}:`, error);
    return null;
  }
}

async function setKV(key, value) {
  try {
    const { db } = await connectToDatabase();
    if (!db) {
      return false;
    }

    const collection = db.collection('app_state');
    await collection.updateOne(
      { _id: key },
      { 
        $set: { 
          value: value, 
          updatedAt: new Date() 
        } 
      },
      { upsert: true }
    );

    return true;
  } catch (error) {
    console.error(`[MongoDB SET Error] Key: ${key}:`, error);
    return false;
  }
}

module.exports = { getKV, setKV, connectToDatabase };
