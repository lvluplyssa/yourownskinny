module.exports = function validateMessage (message) {
  if (!message.text) {
    throw new Error('Missing text property in message');
  }
  if (!message.voice_id) {
    throw new Error('Missing voice_id property in message');
  }
  if (!message.recipient) {
    throw new Error('Missing recipient property in message');
  }
};