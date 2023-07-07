const UserSetting = require('../models/userSetting');
const Conversation = require('../models/conversation');

module.exports = async function handleMsgSent (req, res) {
  const { recipient, sender_name } = req.body;

  // Find The User Settings of the request being made
  const userSetting = await UserSetting.findOne({ senderName: sender_name });
  const { userId } = userSetting;
  const conversationId = `${userId}${recipient}`;

  const existingConversation = await Conversation.findOne({ conversationId });

  // Prepare typing response object
  const nowTyping = {
    typing: 60
  };

  if (existingConversation) {
    if (existingConversation.stillTyping) {
      return res.status(200).json(nowTyping);
    } else {
      return res.status(200);
    }
  } else {
    return res.status(200);
  }
};