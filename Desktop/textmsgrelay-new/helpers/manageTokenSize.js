module.exports = function manageTokenSize (aiResponse, messages) {
  const total_tokens = aiResponse.usage.total_tokens;
  if (total_tokens > 3500) {
    const userIndex = messages.findIndex(obj => obj.role === 'user');
    if (userIndex !== -1) {
      messages.splice(userIndex, 1);
    }
  }
  return messages;

};