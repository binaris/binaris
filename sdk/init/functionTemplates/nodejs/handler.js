/* eslint-disable no-param-reassign */

module.exports.hello = function (event, context, callback) {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: '{UUID}',
      input: event,
      requestContext: context,
    }),
  };
  callback(null, response);
};
