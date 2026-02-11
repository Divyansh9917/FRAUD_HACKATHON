require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Conversation = require('./models/Conversation');

const app = express();

// 1. MIDDLEWARE
// Must be at the top to prevent "Backend Offline" and CORS errors
app.use(cors()); 
app.use(express.json()); 

// 2. DATABASE CONNECTION
// Ensure your .env has the encoded password (Local%40123)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ SUCCESS: Connected to MongoDB Atlas!"))
  .catch((err) => console.log("❌ ERROR: Connection failed:", err.message));

// 3. ROUTES

// Root Route - Fixes "Cannot GET /"
app.get('/', (req, res) => {
  res.send("Agentic Honey-Pot API is Running!");
});

// POST: Save message and trigger AI logic
app.post('/api/messages', async (req, res) => {
  try {
    const { sessionId, message, sender } = req.body;
    let convo = await Conversation.findOne({ sessionId });
    
    if (!convo) {
      convo = new Conversation({ sessionId, history: [] });
    }

    // Add User Message
    convo.history.push({
      sender: sender,
      text: message,
      timestamp: new Date()
    });

    // OPTIONAL: Simple AI Response for testing
    // convo.history.push({
    //   sender: 'scammer',
    //   text: "Hello! I am the AI detector. I received your message.",
    //   timestamp: new Date()
    // });

    await convo.save();
    res.status(201).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Fetch history for the UI
app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const convo = await Conversation.findOne({ sessionId: req.params.sessionId });
    // Returns the history array so UI can map through it
    res.status(200).json(convo ? convo.history : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. SERVER START
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server active on http://localhost:${PORT}`);
});