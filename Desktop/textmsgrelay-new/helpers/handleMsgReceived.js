const Assistant = require('../models/assistant');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const PendingMessage = require('../models/pendingMessage');
const UserSetting = require('../models/userSetting');

const checkBusinessHours = require('./checkBusinessHours');
const checkForAttachments = require('./checkForAttachments');
const getInstructionsMessages = require('./getInstructionsMessages');
const getOwnerMessage = require('./getOwnerMessage');
const processAIResponse = require('./processAIResponse');


module.exports = async function handleMsgReceived (req, res, textHeaders) {
  const { recipient, sender_name, text, speech } = req.body;

  // if empty we outta here
  if (!text && !speech?.text) {
    return res.status(400).json({ typing: 0 });
  }

  // get message content
  const userMessage = speech?.text || text;

  if (!userMessage) {
    throw new Error('No text received');
  }

  try {
    // Find The User Settings of the request being made
    const userSetting = await UserSetting.findOne({ senderName: sender_name });

    const userId = userSetting.userId;
    const conversationId = `${userId}${recipient}`;

    let [activeAssistant, conversation] = await Promise.all([
      Assistant.findOne({ id: userSetting.activeAssistant }),
      await Conversation.findOne({ conversationId })
    ]);

    const lastMessage = await Message.findOne({ conversation: conversation?._id }).sort({ createdAt: -1 });

    const readTime = userSetting.readTime * 1000;

    // Prepare typing response object
    const nowTyping = {
      typing: 60,
      read: true,
      delay: userSetting.readTime
    };

    checkForAttachments(req.body, userSetting, textHeaders);

    // loop roles and traits
    const traitsList = (activeAssistant.traits ?? []).map((trait, index) => `${index + 1}. ${trait}`).join('\n');
    const systemPrompt = `You're an assistant for ${activeAssistant.businessName}. Using your iPhone, you text potential customers, providing helpful info, answering questions, and assisting with their needs. Your goal is to engage in a friendly and professional way, motivating them to make a purchase today. if your response is going to be over 300 characters try to use a double line break somewhere to create space in your conversation and improve readability. Always end with a creative inquiry about any obstacles preventing them from getting started today.
         
         The following content below details all information about who you are.
   
         Character Name: ${activeAssistant.name}
           Age: ${activeAssistant.age}
           Gender: ${activeAssistant.gender}
           Ethnicity: ${activeAssistant.ethnicity}
           Occupation: ${activeAssistant.occupation}
           
           Background Information:
           ${activeAssistant.background}
           
           Personality Traits:
           ${traitsList}
           
           Role within the occupation:
           ${activeAssistant.role}
           
           Interaction Style:
           ${activeAssistant.style}
           
           Additional Information:
           ${activeAssistant.additional}`;

    if (!conversation) {
      conversation = await Conversation.create({
        conversationId
      });

      const ownerMessage = getOwnerMessage(recipient, userSetting);
      const instructionMessages = getInstructionsMessages(recipient, userSetting, conversation._id);

      await Message.create({
        conversation: conversation._id,
        role: 'system',
        content: systemPrompt
      });

      if (ownerMessage) {
        await Message.create({
          role: ownerMessage.role,
          content: ownerMessage.content,
          conversation: conversation._id
        });
      } else if (instructionMessages?.length) {
        await Message.create(instructionMessages);
      }
    }

    // if existing last object is user simply append into it
    const isLastEntryUser = lastMessage && lastMessage.role === 'user';

    if (isLastEntryUser) {
      const newContent = lastMessage.content += ` ${userMessage}`;
      await Message.updateOne({ _id: lastMessage._id }, { content: newContent });
    } else {
      await Message.create({
        role: 'user',
        content: userMessage,
        conversation: conversation._id
      });
    }

    // lets count current messages
    const conversationMessagesAfterUpdate = await Message.find({ conversation: conversation._id });
    const userMessagesCount = conversationMessagesAfterUpdate.filter(message => message.role === 'user').length;

    const processAIArgs = {
      messages: conversationMessagesAfterUpdate,
      conversation,
      recipient,
      userSetting,
      userMessagesCount,
      readTime,
      textHeaders
    };

    if (!userSetting.businessHours) {
      const lastTwoObjects = conversationMessagesAfterUpdate.slice(-2);
      const lastTwoResults = lastTwoObjects.every(obj => obj.role === 'user');

      if (lastTwoResults) {
        return res.status(200).json({ ...nowTyping, delay: 0 });
      }

      processAIResponse(processAIArgs);
      return res.status(200).json(nowTyping);
    }

    // If the BUSINESS_HOURS variable is set to 'true'
    if (checkBusinessHours(userSetting)) {
      const lastTwoObjects = conversationMessagesAfterUpdate.slice(-2);
      const lastTwoResults = lastTwoObjects.every(obj => obj.role === 'user');

      if (lastTwoResults) {
        return res.status(200).json({ ...nowTyping, delay: 0 });
      }

      processAIResponse(processAIArgs);
      return res.status(200).json(nowTyping);
    } else {
      // check if pending exists, add to database
      const existingPending = await PendingMessage.findOne({ conversation: conversation._id, status: 'pending' });

      if (existingPending) {
        const newContent = `${existingPending.content} ${userMessage}`;
        await PendingMessage.updateOne(
          { _id: existingPending._id },
          { content: newContent }
        );
      } else {
        await PendingMessage.create({
          conversation: conversation._id,
          content: userMessage,
          userSetting: userSetting._id,
          status: 'pending',
          recipient
        });
      }

      return res.status(200).send('Outside business hours, will respond later'); // Respond immediately outside of the desired hours
    }
  } catch (error) {
    const userSetting = await UserSetting.findOne({ senderName: sender_name });

    const userId = userSetting.userId;
    const conversationId = `${userId}${recipient}`;

    const conversation = await Conversation.findOne({ conversationId });

    await Conversation.updateOne({ _id: conversation?._id }, { stillTyping: false });
    return res.status(400).send(error);
  }
};