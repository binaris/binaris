exports.handler = async (body, req) => {
  const name = req.query.name || body.name || 'World';
  return `Hello ${name}!`;
};
