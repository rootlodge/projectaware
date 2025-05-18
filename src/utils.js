const CatLoggr = require('cat-loggr');
const { logPath } = require('./config');
const path = require('path');
const fs = require('fs');

const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const logger = new CatLoggr({
  file: logPath,
  level: 'info',
  save: true,
  print: true
});

module.exports = { logger };
