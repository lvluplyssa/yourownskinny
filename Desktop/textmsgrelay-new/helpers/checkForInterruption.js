module.exports = function checkForInterruption (userMessagesCount, conversation, messages) {
  // find last message and check if it's created by user

  // check if a new message came through
  if (conversation) {
    const existingUserMessages = messages.filter(message => message.role === 'user');
    const existingUserMessagesCount = existingUserMessages.length;

    const negativeMessagesCount = (existingUserMessagesCount - userMessagesCount + 1) * -1;

    const newMessage = existingUserMessages.slice(negativeMessagesCount).map(message => message.content).join(' ');
    const lastMessage = existingUserMessages[existingUserMessages.length - 1].content;

    if (existingUserMessagesCount > userMessagesCount) {
      // return the new joined messages
      return newMessage;
    } else {
      return lastMessage;
    }
  }
};