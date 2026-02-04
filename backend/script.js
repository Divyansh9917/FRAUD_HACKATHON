require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Conversation = require('./models/Conversation');

const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => {
    console.log("SUCCESS: Connected to MongoDB");
  })
  .catch((err) => {
    console.log("ERROR: Could not connect to MongoDB");
    console.log(err.message);
  });

app.post('/api/messages', async (req, res) => {
  try {
    const { sessionId, message, sender } = req.body;
    let convo = await Conversation.findOne({ sessionId });

    if (!convo) {
      convo = new Conversation({ sessionId, history: [] });
    }

    convo.history.push({
      sender,
      text: message,
      timestamp: new Date()
    });

    await convo.save();

    res.status(201).json({
      status: "success",
      historyCount: convo.history.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send("Backend Server is Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});