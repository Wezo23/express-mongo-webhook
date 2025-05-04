require('dotenv').config();
const express = require('express');
const { connectToMongoDB, getDb } = require('./db/mongoClient');

const app = express();
app.use(express.raw({ type: '*/*', limit: '2mb' })); // Accept any content type

app.post('/webhook', async (req, res) => {
  const raw = req.body.toString('utf8').replace(/\r/g, '').trim(); // Remove carriage returns

  let messages = [];

  try {
    // Try parsing as a single JSON object
    messages = [JSON.parse(raw)];
  } catch {
    try {
      // Try to parse as multiple JSON objects concatenated together
      const parts = raw.replace(/}\s*{/g, '}\n{').split('\n');
      messages = parts.map(str => JSON.parse(str));
    } catch (err) {
      console.error('🚨 JSON split parsing failed:', err.message);
      console.error('⚠️ Raw content was:\n', raw);
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

    res.sendStatus(200); // Silent success, no 201 message
  } catch (err) {
    console.error('🚨 Mongo insert error:', err.message);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

connectToMongoDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
});
