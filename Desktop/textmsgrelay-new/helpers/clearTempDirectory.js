const fs = require('fs/promises');
const path = require('path');

module.exports = async function clearTempDirectory () {
  const directory = path.join(__dirname, 'public/temp');

  try {
    const files = await fs.readdir(directory);
    const unlinkPromises = files.map(file => fs.unlink(path.join(directory, file)));
    await Promise.all(unlinkPromises);
  } catch (err) {
    throw err;
  }
};