module.exports.handler = function (event, context, callback) {
  const name = event.body.name || 'anonymous';
  const response = {
    statusCode: 200,
    body: `Welcome to Binaris ${name}`
  };
  callback(null, response);
};
