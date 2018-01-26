exports.handler = (event, context, callback) => {
  const name = event.queryStringParameters.name || event.body.name || 'World';
  console.log(`Hello ${name}!`);
  callback(null, { statusCode: 200, body: `Hello ${name}!` });
};
