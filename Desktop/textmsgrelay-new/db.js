const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL;

async function connectToDatabase () {
  try {
    await mongoose.connect(dbUrl);
    await mongoose.syncIndexes();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports = connectToDatabase;