const axios = require('axios');
const path = require('path');
const fs = require('fs');
const generateRandomString = require('./generateRandomString');

const { SENDER_NAME, VOICE_URL, MSG_URL } = process.env;

module.exports = async function sendVoiceNote (message, voiceData, req, res, voiceheaders, textHeaders) {
  const audioResponse = await axios.post(`${VOICE_URL}${message.voice_id}`, voiceData, { headers: voiceheaders, responseType: 'stream' });

  const randomString = generateRandomString(10);
  const filePath = path.join(__dirname, 'public/temp', `${randomString}.mp3`);
  const writer = fs.createWriteStream(filePath);

  audioResponse.data.pipe(writer);

  writer.on('finish', async () => {
    const rootUrl = `https://${req.get('host')}`;
    const mediaUrl = `${rootUrl}/temp/${randomString}.mp3`;

    const textData = {
      recipient: message.recipient,
      media_url: mediaUrl,
      sender_name: SENDER_NAME,
      audio_message: true
    };

    try {
      const textResponse = await axios.post(MSG_URL, textData, { headers: textHeaders });
      console.log(textResponse.data);
      return res.status(200).send('Text message sent successfully');
    } catch (error) {
      console.error(error);
      return res.status(500).send('Error sending text message');
    } finally {
      return writer.destroy();
    }
  });

  writer.on('error', (error) => {
    console.error(error);
    return res.status(500).send('Error writing audio file');
  });
};