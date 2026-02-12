require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Conversation = require('./models/conversation');

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ SUCCESS: Connected to MongoDB Atlas!"))
  .catch((err) => console.error("❌ ERROR: MongoDB Connection Failed:", err.message));

// --- API ROUTES ---

// 1. Health Check
app.get('/', (req, res) => res.send("BaatChit Backend Active"));

// 2. GET: Fetch History (Sidebar polling ke liye)
app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const convo = await Conversation.findOne({ sessionId: req.params.sessionId });
    res.status(200).json(convo || { history: [], extractedIntelligence: {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. POST: AI Agent Call (Postman jaisa exact behavior)
app.post('/api/messages', async (req, res) => {
  const { sessionId, message } = req.body;
  const timeMs = Date.now(); 

  try {
    let convo = await Conversation.findOne({ sessionId });
    if (!convo) convo = new Conversation({ sessionId, history: [] });

    // Step A: Save user message in local DB
    const userMsg = { sender: 'user', text: message, timestamp: timeMs };
    convo.history.push(userMsg);

    // Step B: Call Vercel Agent (Exact Postman Structure)
    try {
      const aiResponse = await axios.post(process.env.AI_AGENT_URL, {
        sessionId: sessionId,
        // Match the 'Message' Pydantic model exactly
        message: {
          sender: "user",
          text: message,
          timestamp: timeMs 
        },
        // Match 'conversationHistory' as a List of Message objects
        conversationHistory: convo.history.map(msg => ({
          sender: msg.sender,
          text: msg.text,
          timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : new Date(msg.timestamp).getTime()
        })),
        // Metadata fields as defined in Python models.py
        metadata: {
          channel: "Chat",
          language: "English",
          locale: "IN"
        }
      }, {
        headers: { 
          'x-api-key': process.env.AI_AGENT_KEY, // Python auth verify_api_key check
          'Content-Type': 'application/json' 
        },
        timeout: 35000 // Vercel cold starts ke liye extra time
      });

      // Step C: Save AI Reply from 'MessageResponse'
      const botReply = aiResponse.data.reply;
      convo.history.push({ 
        sender: 'scammer', 
        text: botReply, 
        timestamp: Date.now() 
      });
      
      // Sidebar intelligence sync
      if (aiResponse.data.extractedIntelligence) {
        convo.extractedIntelligence = aiResponse.data.extractedIntelligence;
      }

    } catch (aiErr) {
      // DEBUG: Terminal mein check karo error 403 hai ya 422
      console.error("--- AGENT ERROR ---");
      console.error("Status Code:", aiErr.response?.status); 
      console.error("Response Data:", aiErr.response?.data?.detail || aiErr.message);
      
      convo.history.push({ 
        sender: 'scammer', 
        text: "[AI Agent Error: Check Backend Logs]", 
        timestamp: Date.now() 
      });
    }

    await convo.save();
    res.status(201).json({ status: "success" });

  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));