exports.handler = (event, context, callback) => {
  const name = event.queryStringParameters.name || event.body.name || 'World';
  // eslint-disable-next-line no-console
  console.log(`Hello ${name}!`);
  callback(null, { statusCode: 200, body: `Hello ${name}!` });
};
