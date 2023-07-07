const { Configuration, OpenAIApi } = require('openai');

const checkForInterruption = require('./checkForInterruption');
const checkForInterruptionMultiple = require('./checkForInterruptionMultiple');
const sendImessage = require('./sendImessage');
const Conversation = require('../models/conversation');

const configuration = new Configuration({
  apiKey: process.env.AI_SECRET_KEY
});

const openai = new OpenAIApi(configuration);

module.exports = async function processAIResponse ({
  messages,
  conversation,
  recipient,
  userSetting,
  userMessagesCount,
  readTime,
  textHeaders
}) {
  console.log('in process');
  const ai = require('../ai.js')(openai);

  const outGoingMessages = messages.map(message => ({
    role: message.role,
    content: message.content
  }));

  const [aiResponseWithMsgArray] = await Promise.all([
    ai(outGoingMessages),
    await Conversation.updateOne({ _id: conversation._id }, { stillTyping: true })
  ]);

  const messageContent = aiResponseWithMsgArray.response.choices[0].message.content;
  // redefine messages now that we have a response from manageToken
  const aiMessages = aiResponseWithMsgArray.messages;

  const lines = messageContent.split('\n\n');

  // Log AI generation
  console.log(`AI has generated ${messageContent}`);

  if (!lines.length) {
    return;
  }

  const wordsInLine = lines[0].split(' ').length;
  const multipliedCount = wordsInLine * 500;
  const combinedTime = multipliedCount + readTime;
  const msgleft = lines.length;

  // wait time and how many will send log
  console.log(`There is ${msgleft} scheduled with the first text sending in ${combinedTime / 1000} seconds`);


  setTimeout(async () => {
    const additionalComments = checkForInterruption(userMessagesCount, conversation, messages);
    if (additionalComments !== aiMessages[messages.length - 1].content) {
      throw new Error('interrupted');
    }

    let lastMessage = aiMessages[aiMessages.length - 1];

    // Process the first message immediately
    lastMessage = await sendImessage({ message: lines[0], recipient, userSetting, conversation, textHeaders });

    // Process remaining message by calculating their word count
    const timeouts = [];
    let accumulatedDelay = 0;


    for (let i = 1; i < lines.length; i++) {
      const wordsInLine = lines[i].split(' ').length;
      const multipliedCount = wordsInLine * 500;
      accumulatedDelay += multipliedCount;
      console.log(`Text #${i} will send in ${multipliedCount / 1000} seconds`);

      timeouts[i] = setTimeout(async () => {
        // See if they said something while we are sending a message
        const areTheyTalking = checkForInterruptionMultiple(lastMessage);
        console.log('Checking for interruption multiple');

        if (areTheyTalking) {
          console.log('They said something, stop');
          clearTimeouts(timeouts); // Cancel all timeouts
          return;
        }

        lastMessage = await sendImessage({ message: lines[i], recipient, userSetting, conversation, textHeaders });
      }, accumulatedDelay);
    }

  }, combinedTime);
};

function clearTimeouts (timeouts) {
  timeouts.forEach(timeout => clearTimeout(timeout));
}