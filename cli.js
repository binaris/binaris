const commander = require('commander');
// grab the version to keep things consistent
const { version } = require('./package.json');
const { deployHandler, createHandler, invokeHandler,
  logHandler, loginHandler, removeHandler, unknownHandler } = require('./lib');

const actionWrapper = function actionWrapper(action, actionOptions) {
  return async (options) => {
    await action({
      options: Object.assign({}, actionOptions, options, { path: commander.path }),
      args: commander.args,
      rawArgs: commander.rawArgs,
      name: commander.args[commander.args.length - 1]._name,
    });
  };
};

// again not the cleanest solution but the practical one while
// still using commander instead of yargs
const namedActionHandler = function namedActionHandler(action) {
  return async (funcName, options) => {
    await action({
      options: Object.assign({}, { function: funcName }, options, { path: commander.path }),
      args: commander.args,
      rawArgs: commander.rawArgs,
      name: commander.args[commander.args.length - 1]._name,
    });
  };
};

commander
  .version(version)
  .description('Binaris command line interface')
  .option('-p, --path <path>',
    // eslint-disable-next-line quotes
    'Use directory dir. "create" will create this directory if needed.');

commander
  .command('login')
  .description('Login to your Binaris account using an API key')
  .action(actionWrapper(loginHandler));

commander
  .command('logs <function>')
  .description('Print the logs of a function')
  .option('-t, --tail',
    'Outputs logs in "tail -f" fashion')
  .action(namedActionHandler(logHandler));

commander
  .command('create')
  .description('Create a function from template')
  .option('-f, --function <name>',
    'Name of the function to generate. If omitted, a name will be chosen at random')
  .action(actionWrapper(createHandler));

commander
  .command('deploy <function>')
  .description('Deploys a function to the cloud')
  .action(namedActionHandler(deployHandler));

commander
  .command('remove <function>')
  .description('Remove a previously deployed function')
  .action(namedActionHandler(removeHandler));

commander
  .command('invoke <function>')
  .description('Invoke a Binaris function')
  .option('-d, --data <data>', 'Data to send with invocation')
  .option('-j, --json <filePath>', 'Path to file containing JSON data')
  .action(namedActionHandler(invokeHandler));

commander
  .command('*', null, { noHelp: true })
  .description('')
  .action(actionWrapper(unknownHandler));

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
