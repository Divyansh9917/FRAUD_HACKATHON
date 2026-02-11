require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Conversation = require('./models/Conversation');

const app = express();


app.use(cors()); 
app.use(express.json()); 


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ SUCCESS: Connected to MongoDB Atlas!"))
  .catch((err) => console.log("❌ ERROR: Connection failed:", err.message));


app.get('/', (req, res) => {
  res.send("Agentic Honey-Pot API is Running!");
});


app.post('/api/messages', async (req, res) => {
  try {
    const { sessionId, message, sender } = req.body;
    let convo = await Conversation.findOne({ sessionId });
    
    if (!convo) {
      convo = new Conversation({ sessionId, history: [] });
    }

    convo.history.push({
      sender: sender,
      text: message,
      timestamp: new Date()
    });

    await convo.save();
    res.status(201).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/api/history/:sessionId', async (req, res) => {
  try {
    const convo = await Conversation.findOne({ sessionId: req.params.sessionId });
    // Returns the history array so UI can map through it
    res.status(200).json(convo ? convo.history : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server active on http://localhost:${PORT}`);
});