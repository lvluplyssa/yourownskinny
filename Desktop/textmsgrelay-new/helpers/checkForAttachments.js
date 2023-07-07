const sendReaction = require('./sendReaction');

module.exports = function checkForAttachments (messageObj, userSetting, textHeaders) {
  if (messageObj.attachments && messageObj.attachments.length > 0) {
    sendReaction('love', messageObj, userSetting, textHeaders);
  }
};