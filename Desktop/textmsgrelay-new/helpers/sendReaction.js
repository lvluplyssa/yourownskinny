const axios = require('axios');

const MSG_URL = process.env.MSG_ENDPOINT;

module.exports = function sendReaction (reaction, messageObj, userSetting, textHeaders) {
  setTimeout(async () => {

    const reactionData = {
      recipient: messageObj.recipient,
      text: '',
      sender_name: messageObj.sender_name,
      message_id: messageObj.message_id,
      reaction
    };

    const response = await axios.post(MSG_URL, reactionData, { headers: textHeaders });
    return response.data;

  }, userSetting.readTime);
};