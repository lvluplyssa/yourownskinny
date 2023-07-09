const axios = require('axios');
const { MSG_URL } = process.env;
const UserSetting = require('../models/userSetting');
const Conversation = require('../models/conversation');
const Message = require('../models/message');

module.exports = async function sendImessage ({ message, recipient, userSetting, conversation, textHeaders, isSms }) {
  const textData = {
    recipient,
    text: message,
    sender_name: userSetting.senderName
  };

  if(isSms) {
    textData.sms = isSms;
  }

  try {
    const response = await axios.post(MSG_URL, textData, { headers: textHeaders });

    // if systemPrompt received from owner
    const matchingOwner = userSetting.owners.find((ownerObj) => ownerObj.recipient === recipient);
    if (matchingOwner && /\{.*\}/.test(response.data.text)) {
      const newInstructions = {
        date: new Date(),
        instructions: response.data.text.match(/{(.*?)}/)[1],
        from: recipient
      };

      // Find The User Settings of the request being made
      if (!userSetting) {
        throw new Error('User settings not found');
      }


      // Find the document with the matching userId and append newInstructions to ownerInstructions array
      await UserSetting.updateOne(
        { userId: userSetting.userId }, // find the document with this userId
        { $push: { 'assistant.ownerInstructions': newInstructions } } // append newInstructions to the array
      );
      console.log('new instructions added');
    }

    let newMessage;

    if (conversation) {
      const responseObj = { role: 'assistant', content: message };
      // save chatgpt responses in the message array

      const resolvedPromises = await Promise.all([
        Conversation.updateOne(
          { _id: conversation._id },
          { $push: { messages: responseObj } }
        ),
        Message.create({ ...responseObj, conversation: conversation._id })
      ]);

      newMessage = resolvedPromises[1];
    }

    // log all outgoing texts
    console.log(`Text sent is ${response.data.text}`);

    return newMessage;

  } catch (error) {
    console.log(error);
  }
};