const winston = require('winston');

winston.loggers.add('binaris', {
  transports: [
    new (winston.transports.Console)({
      stringify: true,
      level: process.env.LOG_LEVEL || 'info',
      prettyPrint: true,
      formatter: (options) => {
        return (options.message ? options.message : '') +
          (options.meta && Object.keys(options.meta).length ? '\n\t'
          + JSON.stringify(options.meta) : '');
      },
    }),
  ],
});

module.exports = winston.loggers.get('binaris');
