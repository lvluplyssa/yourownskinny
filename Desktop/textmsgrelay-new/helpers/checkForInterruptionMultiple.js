module.exports = function checkForInterruptionMultiple (message) {
  // check if a new message came through
  const lastRole = message.role;

  if (lastRole !== 'assistant') {
    return true;
  }
};