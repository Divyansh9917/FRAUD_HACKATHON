require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Conversation = require('./models/Conversation');

const app = express();

// Update CORS to allow your specific frontend domain
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ DB Error:", err));

// History Fetching
app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const convo = await Conversation.findOne({ sessionId: req.params.sessionId });
    res.status(200).json(convo || { history: [], extractedIntelligence: {} });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Message Handling
app.post('/api/messages', async (req, res) => {
  const { sessionId, message } = req.body;
  const timeMs = Date.now(); 

  try {
    let convo = await Conversation.findOne({ sessionId });
    if (!convo) convo = new Conversation({ sessionId, history: [] });

    convo.history.push({ sender: 'user', text: message, timestamp: timeMs });

    try {
      const aiRes = await axios.post(process.env.AI_AGENT_URL, {
        sessionId: sessionId,
        message: { sender: "user", text: message, timestamp: timeMs },
        conversationHistory: convo.history.map(m => ({
          sender: m.sender, text: m.text, timestamp: m.timestamp
        })),
        metadata: { channel: "Chat", language: "English", locale: "IN" }
      }, {
        headers: { 'x-api-key': process.env.AI_AGENT_KEY, 'Content-Type': 'application/json' },
        timeout: 35000 
      });

      convo.history.push({ sender: 'scammer', text: aiRes.data.reply, timestamp: Date.now() });
      if (aiRes.data.extractedIntelligence) {
        convo.extractedIntelligence = aiRes.data.extractedIntelligence;
      }
    } catch (aiErr) {
      console.error("AI Error:", aiErr.response?.data || aiErr.message);
      convo.history.push({ sender: 'scammer', text: "[Agent Offline]", timestamp: Date.now() });
    }

    await convo.save();
    res.status(201).json({ status: "success" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Export for Vercel Serverless
module.exports = app;