module.exports = function getInstructionsMessages (recipient, userSetting, conversationId) {
  const matchingOwner = userSetting.owners.find(ownerObj => ownerObj.recipient === recipient);

  if (matchingOwner) {
    return;
  }

  const messages = [];

  const { ownerInstructions } = userSetting;

  for (const instructionObj of ownerInstructions) {
    const { instruction } = instructionObj;

    if (!messages.some(message => message.role === 'system' && message.content === instruction)) {
      messages.push({
        role: 'system',
        content: instruction,
        conversation: conversationId
      });
    }
  }

  return messages;
};