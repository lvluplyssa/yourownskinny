require('dotenv').config();
const express = require('express');
const moment = require('moment-timezone');
const schedule = require('node-schedule');

const validateMessage = require('./helpers/validateMessage');
const clearTempDirectory = require('./helpers/clearTempDirectory');
const createVoiceData = require('./helpers/createVoiceData');
const sendVoiceNote = require('./helpers/sendVoiceNote');
const handleMsgReceived = require('./helpers/handleMsgReceived');
const handleMsgSent = require('./helpers/handleMsgSent');
const checkBusinessHours = require('./helpers/checkBusinessHours');

const PORT = process.env.PORT || 3000;
const { AUTHORIZATION_KEY, SECRET_KEY, MSG_TOKEN, VOICE_API_KEY } = process.env;

moment.tz.setDefault('America/New_York');

// Configure headers
const textHeaders = {
  'Content-Type': 'application/json',
  Authorization: AUTHORIZATION_KEY,
  'Loop-Secret-Key': SECRET_KEY
};

const voiceheaders = {
  'Content-Type': 'application/json',
  accept: 'audio/mpeg',
  'xi-api-key': VOICE_API_KEY
};


const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const connectToDatabase = require('./db');
const PendingMessage = require('./models/pendingMessage');

async function startServer () {
  await connectToDatabase();

  // Configure '/voicenote' endpoint
  app.post('/voicenote', async function (req, res) {
    const message = req.body;

    // Check if required properties exist
    try {
      validateMessage(message);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      return res.status(400).send(error.message);
    }

    if (!message.repeat) {
      // Delete all files in the directory after successful completion
      await clearTempDirectory();
    }

    const voiceData = createVoiceData(message.text);

    try {
      await sendVoiceNote(message, voiceData, req, res, voiceheaders, textHeaders);
    } catch (error) {
      console.error('Voice API error:', error);
      return res.status(500).send('Voice API error');
    }
  });

  app.post('/inbound', async function (req, res) {
    // authorized only
    if (req.headers['authorization'] !== MSG_TOKEN) {
      return res.status(401).send('Unauthorized');
    }

    try {
      switch (req.body.alert_type) {
        case 'message_sent':
        // code block
          await handleMsgSent(req, res);
          break;
        case 'message_inbound':
        // code block
          await handleMsgReceived(req, res, textHeaders);
          break;
        default:
      // code block
      }
    } catch (error) {
      return res.status(400).send(error);
    }
  });

  // start the cron for pending
  startCronJob();

  app.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
  });
}

startServer();

async function checkPendingJob () {
  const pendingMessages = await PendingMessage.find({ status: 'pending' }).populate('userSetting');
  const pendingMessageIds = pendingMessages.map(pendingMessage => pendingMessage._id);

  // find userSetting from pending
  for (const pendingMessage of pendingMessages) {
    if (checkBusinessHours(pendingMessage.userSetting)) {
      const req = {
        body: {
          alert_type: 'message_inbound',
          recipient: pendingMessage.recipient,
          sender_name: pendingMessage.userSetting.senderName,
          text: pendingMessage.content
        }
      };
      const res = {
        status: () => res,
        json: () => res
      };
      handleMsgReceived(req, res, textHeaders);
      // Delete the pending conversation
    }
  }

  await PendingMessage.updateMany({ _id: { $in: pendingMessageIds } }, { status: 'done' });
}

function startCronJob () {
  const cronSchedule = '0 * * * *'; // Runs every hour
  schedule.scheduleJob(cronSchedule, checkPendingJob);
}