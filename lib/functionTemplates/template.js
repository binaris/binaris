module.exports = (runtime, handlerName) => {
  const node8Template =
`'use strict'

/**
 * @type { import("./binaris").Handler }
 */
exports.${handlerName} = async (body, context) => {
  const name = context.request.query.name || body.name || 'World';
  return \`Hello \${name}!\`;
};`;

  const pythonTemplate =
`def ${handlerName}(body, req):
    name = req.query.get('name') or body.get('name') or 'World'
    return 'Hello {}!'.format(name)`;


  const java8Template =
`import com.binaris.*;
import com.google.gson.JsonElement;

public class ${handlerName} implements BinarisFunction {
    public Object handle(JsonElement body, BinarisRequest request) {
        return "Hello, world";
    }
}`;
  const runtimeTemplates = {
    node8: node8Template,
    python2: pythonTemplate,
    pypy2: pythonTemplate,
    java8: java8Template,
    python3: pythonTemplate,
  };

  return runtimeTemplates[runtime];
};
