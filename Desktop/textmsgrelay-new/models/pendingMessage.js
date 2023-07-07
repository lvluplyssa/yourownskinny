const mongoose = require('mongoose');

const pendingSchema = new mongoose.Schema({
  role: String,
  content: String,
  conversation: [{ type: mongoose.Schema.Types.ObjectId, ref: 'conversation' }],
  status: String,
  userSetting: [{ type: mongoose.Schema.Types.ObjectId, ref: 'userSetting' }],
  recipient: String
}, { timestamps: true });

pendingSchema.set('toObject', { virtuals: true });
pendingSchema.set('toJSON', { virtuals: true });

pendingSchema.index({ status: 1 });

const PendingMessage = mongoose.model('pendingMessage', pendingSchema);

module.exports = PendingMessage;