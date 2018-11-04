exports.handler = async (body, ctx) => {
  const name = ctx.request.query.name || body.name || 'World';
  return `Hello ${name}!`;
};
