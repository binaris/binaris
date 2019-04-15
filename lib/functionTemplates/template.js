const format = require('string-format');

const node8Template =
`'use strict'

/**
 * @type {{ import("./binaris").Handler }}
 */
exports.{entrypoint} = async (body, context) => {
  const name = context.request.query.name || body.name || 'World';
  return \`Hello \${{name}}!\`;
};`;

const pythonTemplate =
`def {entrypoint}(body, req):
    name = req.query.get('name') or body.get('name') or 'World'
    return 'Hello {{}}!'.format(name)`;

const runtimeTemplates = {
  node8: node8Template,
  python2: pythonTemplate,
  pypy2: pythonTemplate,
  python3: pythonTemplate,
};

module.exports = (runtime, entrypoint) => {
  return format(runtimeTemplates[runtime], { entrypoint });
};
