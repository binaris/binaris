// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const deployEndpoint =
  process.env.BINARIS_DEPLOY_ENDPOINT || 'api.binaris.com';

// TODO: ensure that this is configured in a better way, having a single
// variable in the deploy file is inadequate
const invokeEndpoint =
      process.env.BINARIS_INVOKE_ENDPOINT || 'run.binaris.com';

module.exports = { deployEndpoint, invokeEndpoint };
