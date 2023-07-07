const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: Number,
  startTime: Number,
  endTime: Number,
  activeAssistant: Number,
  readTime: Number,
  businessHours: Boolean,
  assistants: [Number],
  owners: [{ recipient: String, name: String }],
  senderName: String,
  ownerInstructions: [String]
}, { timestamps: true });

userSettingsSchema.set('toObject', { virtuals: true });
userSettingsSchema.set('toJSON', { virtuals: true });

userSettingsSchema.index({ senderName: 1 });

const UserSettings = mongoose.model('userSettings', userSettingsSchema);

module.exports = UserSettings;