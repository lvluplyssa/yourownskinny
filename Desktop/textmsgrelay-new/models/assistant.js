const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
  name: String,
  id: Number,
  age: Number,
  gender: String,
  ethnicity: String,
  occupation: String,
  background: String,
  role: String,
  style: String,
  additional: String,
  businessName: String,
  traits: [String]
}, { timestamps: true });

assistantSchema.set('toObject', { virtuals: true });
assistantSchema.set('toJSON', { virtuals: true });

assistantSchema.index({ id: 1 }, { unique: true });

const Assistant = mongoose.model('assistant', assistantSchema);

module.exports = Assistant;