require('dotenv').config();
const express = require('express');
const { connectToMongoDB, getDb } = require('./db/mongoClient');

const app = express();
app.use(express.raw({ type: '*/*', limit: '2mb' }));

app.post('/webhook', async (req, res) => {
  const raw = req.body.toString('utf8').trim();
  let messages = [];

  try {
    messages = [ JSON.parse(raw) ];
  } catch {
    const parts = raw.replace(/}\s*{/g, '}\n{').split('\n');
    try {
      messages = parts.map(str => JSON.parse(str));
    } catch (err) {
      console.error('🚨 JSON split parsing failed:', err.message);
      return res.status(400).json({ success: false, error: 'Invalid JSON format' });
    }
  }

  const db = getDb();
  const col = db.collection(process.env.COLLECTION_NAME);

  try {
    await col.insertMany(messages.map(m => ({
      data: m,
      receivedAt: new Date()
    })));

    res.sendStatus(200); // 🔄 Changed from res.status(201)... to silent success
  } catch (err) {
    console.error('🚨 Mongo insert error:', err.message);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

connectToMongoDB().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });
}).catch(err => {
  console.error('MongoDB connection failed:', err.message);
});
