module.exports.handler = function (input, context, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Welcome to Binaris',
      input,
      context,
    }),
  };
  callback(null, response);
};
