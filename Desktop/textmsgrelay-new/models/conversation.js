const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  conversationId: String,
  stillTyping: Boolean
}, { timestamps: true });

conversationSchema.set('toObject', { virtuals: true });
conversationSchema.set('toJSON', { virtuals: true });

conversationSchema.index({ conversationId: 1 }, { unique: true });

const Conversation = mongoose.model('conversation', conversationSchema);

module.exports = Conversation;