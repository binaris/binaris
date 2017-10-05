exports.handler = (event, context, callback) => {
  const name = event.queryStringParameters.name || event.body.name || 'World';
  callback(null, { statusCode: 200, body: `Hello ${name}!` });
};
