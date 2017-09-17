module.exports.handler = function (event, context, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Welcome to Binaris',
      input: event,
      context,
    }),
  };
  callback(null, response);
};
