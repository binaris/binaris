const winston = require('winston');

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
  const isError = (options.level === 'error');
  const body = options.message ? options.message : '';
  const sufix = (options.meta && Object.keys(options.meta).length
   ? `\n\t${JSON.stringify(options.meta)}` : '');

  return config.colorize(options.level, `${body}${sufix}`);
};

winston.loggers.add('binaris', {
  transports: [
    new (winston.transports.Console)({
      stringify: true,
      level: process.env.BINARIS_LOG_LEVEL || 'info',
      prettyPrint: true,
      colorize: true,
      // eslint-disable-next-line arrow-body-style
      formatter,
    }),
  ],
});

module.exports = winston.loggers.get('binaris');
