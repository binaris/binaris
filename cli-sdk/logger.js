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

winston.loggers.add('binaris', {
  transports: [
    new (winston.transports.Console)({
      stringify: true,
      level: process.env.BINARIS_LOG_LEVEL || 'info',
      prettyPrint: true,
      colorize: true,
      // eslint-disable-next-line arrow-body-style
      formatter: (options) => {
        return config.colorize(options.level,
          (((options.level === 'error') ? 'bn: ' : '') +
          (options.message ? options.message : '') +
          // eslint-disable-next-line prefer-template
          (options.meta && Object.keys(options.meta).length ? '\n\t'
          + JSON.stringify(options.meta) : '')));
      },
    }),
  ],
});

module.exports = winston.loggers.get('binaris');
