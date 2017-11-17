const commander = require('commander');
// grab the version to keep things consistent
const { version } = require('./package.json');
const { deployHandler, createHandler, invokeHandler,
  logHandler, loginHandler, removeHandler, unknownHandler } = require('./lib');

const actionWrapper = function actionWrapper(action) {
  return async (options) => {
    await action({
      options: Object.assign({}, options, { path: commander.path }),
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
    'Use directory dir. "init" will create this directory if needed.');

commander
  .command('login')
  .description('Login to your Binaris account using an API key')
  .action(actionWrapper(loginHandler));

commander
  .command('logs')
  .description('Print the logs of a function')
  .option('-t, --tail',
    'Outputs logs in "tail -f" fashion')
  .option('-f, --function <name>',
    'Name of the function to print the logs of')
  .action(actionWrapper(logHandler));

commander
  .command('create')
  .description('Create a function from template')
  .option('-f, --function <name>',
    'Name of the function to generate. If omitted, a name will be chosen at random')
  .action(actionWrapper(createHandler));

commander
  .command('deploy')
  .description('Deploys a function to the cloud')
  .option('-f, --function <name>',
    'Name of the function to deploy')
  .action(actionWrapper(deployHandler));

commander
  .command('remove')
  .description('Remove a previously deployed function')
  .option('-f, --function <name>',
    'Name of the function to remove')
  .action(actionWrapper(removeHandler));

commander
  .command('invoke')
  .description('Invoke a Binaris function')
  .option('-f, --function <name>',
    'Name of the function to invoke')
  .option('-d, --data <data>', 'Data to send with invocation')
  .option('-j, --json <filePath>', 'Path to file containing JSON data')
  .action(actionWrapper(invokeHandler));

commander
  .command('*', null, { noHelp: true })
  .description('')
  .action(actionWrapper(unknownHandler));

commander
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  commander.outputHelp();
}
