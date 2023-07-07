const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: String,
  content: String,
  conversation: [{ type: mongoose.Schema.Types.ObjectId, ref: 'conversation' }]
}, { timestamps: true });

messageSchema.set('toObject', { virtuals: true });
messageSchema.set('toJSON', { virtuals: true });

messageSchema.index({ conversation: 1 });

const Message = mongoose.model('message', messageSchema);

module.exports = Message;