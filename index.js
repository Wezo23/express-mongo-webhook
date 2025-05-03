// index.js
require('dotenv').config();
const express = require('express');
const { connectToMongoDB, getDb } = require('./db/mongoClient');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/webhook', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection(process.env.COLLECTION_NAME);

    const document = {
      data: req.body,
      receivedAt: new Date(),
    };

    const result = await collection.insertOne(document);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error('Error saving webhook:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});

connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
});
