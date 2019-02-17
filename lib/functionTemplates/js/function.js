/**
 * @type { import("./binaris").BinarisFunction }
 */
exports.handler = async (body, context) => {
  const name = context.request.query.name || body.name || 'World';
  return `Hello ${name}!`;
};
