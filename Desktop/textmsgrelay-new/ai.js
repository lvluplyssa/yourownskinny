// ai.js
const manageTokenSize = require('./helpers/manageTokenSize');
module.exports = function (openai) {
  return async function (messages) {

    const model = 'gpt-3.5-turbo';
    const maxTokens = 500;
    const temperature = 1.0;
    const top_p = 1.0;
    try {

      let response;
      try {
        response = await openai.createChatCompletion({
          model: model || 'gpt-3.5-turbo',
          messages,
          max_tokens: maxTokens || 500,
          temperature: temperature || 0.8,
          top_p: top_p || 1
        });
      } catch (error) {
        console.error(error.response.data); // Log the OpenAI API error
        throw error; // Re-throw the error to handle it in the outer catch block
      }
      messages = await manageTokenSize(response.data, messages);
      return { messages, response: response.data };
    } catch (err) {
      // console.error(err);
      return { error: err.toString() };
    }
  };
};