// db/mongoClient.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

let db;

async function connectToMongoDB() {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  db = client.db(process.env.DB_NAME);
  console.log('Connected to MongoDB');
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

module.exports = { connectToMongoDB, getDb };
