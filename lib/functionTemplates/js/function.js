'use strict'

/**
 * @type { import("./binaris").Handler }
 */
exports.HANDLER_NAME = async (body, context) => {
  const name = context.request.query.name || body.name || 'World';
  return `Hello ${name}!`;
};
