const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: String,
  text: String,
  timestamp: Number 
});

const ConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  history: [MessageSchema],
  extractedIntelligence: {
    bankAccounts: { type: [String], default: [] },
    upiIds: { type: [String], default: [] },
    phishingLinks: { type: [String], default: [] },
    phoneNumbers: { type: [String], default: [] }
  }
});

module.exports = mongoose.model('Conversation', ConversationSchema);