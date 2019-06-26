'use strict';

const winston = require('winston');
const supportsColor = require('supports-color');

const config = winston.config;

const colorLevels = {
  silly: 'white',
  debug: 'white',
  verbose: 'white',
  info: 'white',
  warn: 'yellow',
  error: 'red',
};

winston.addColors(colorLevels);

const formatter = function formatter(options) {
  const body = options.message ? options.message : '';
  const suffix = (options.meta && Object.keys(options.meta).length
    ? `\n\t${JSON.stringify(options.meta)}` : '');

  const fullLog = `${body}${suffix}`;
  return supportsColor.stdout ? config.colorize(options.level, fullLog) : fullLog;
};

winston.loggers.add('binaris', {
  transports: [
    new (winston.transports.Console)({
      stringify: true,
      level: process.env.BINARIS_LOG_LEVEL || 'info',
      prettyPrint: true,
      colorize: supportsColor.stdout,
      // eslint-disable-next-line arrow-body-style
      formatter,
    }),
  ],
});

module.exports = winston.loggers.get('binaris');
