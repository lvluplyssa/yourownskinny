const moment = require('moment-timezone');

module.exports = function checkBusinessHours (userSetting) {
  const hour = moment().hour();

  // If current time is between business hours settings EST
  if (hour >= userSetting.startTime && hour < userSetting.endTime) {
    return true;
  } else {
    return false;
  }
};