// index.js
require('dotenv').config();
const express = require('express');
const { connectToMongoDB, getDb } = require('./db/mongoClient');

const app = express();

// Use raw body parser instead of JSON
app.use(express.raw({ type: '*/*', limit: '2mb' }));

app.post('/webhook', async (req, res) => {
  const raw = req.body.toString('utf8').trim();

  let messages = [];

  try {
    // Try simple JSON parse first
    messages = [ JSON.parse(raw) ];
  } catch {
    // Split glued JSON objects
    const parts = raw.replace(/}\s*{/g, '}\n{').split('\n');
    try {
      messages = parts.map(part => JSON.parse(part));
    } catch (err) {
      console.error('🚨 JSON parsing failed:', parts, err.message);
      return res.status(400).json({ success: false, error: 'Invalid JSON format' });
    }
  }

  try {
    const db = getDb();
    const col = db.collection(process.env.COLLECTION_NAME);

    // Insert all parsed messages
    const result = await col.insertMany(messages.map(msg => ({
      data: msg,
      receivedAt: new Date()
    })));

    res.status(201).json({
      success: true,
      insertedCount: result.insertedCount
    });
  } catch (err) {
    console.error('🚨 DB Insert error:', err.message);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// Start server
connectToMongoDB().then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
  });
}).catch(err => {
  console.error('MongoDB init failed:', err.message);
});
