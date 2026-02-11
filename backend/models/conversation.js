const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  history: [MessageSchema]
});

module.exports = mongoose.model('Conversation', ConversationSchema);