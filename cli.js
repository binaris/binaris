const commander = require('commander');
// grab the version to keep things consistent
const { version } = require('./package.json');
const { initHandler, deployHandler, removeHandler,
   invokeHandler, unknownHandler } = require('./cli-sdk');

const runCLI = function runCLI(input) {
  const exitCode = new Promise((resolve) => {
    const actionWrapper = function actionWrapper(action, useGlobals) {
      const aWrapper = async function aWrapper(options) {
        let aggr = options;
        if (useGlobals) {
          aggr = Object.assign({}, options, commander);
        }
        const actionResult = await action(aggr);
        resolve(actionResult);
      };
      return aWrapper;
    };

    commander
      .version(version)
      .description('Binaris command line interface')
      .option('-p, --path <path>',
        // eslint-disable-next-line quotes
        `Change to directory dir before doing anything else. Create if non-existent`);

    commander
      .command('init')
      .description('Initialize a function from template')
      .option('-f, --function <name>',
        'Name of the function to generate. If omitted, a name will be chosen at random')
      .action(actionWrapper(initHandler, true));

    commander
      .command('deploy')
      .description('Deploys a function to the cloud')
      .option('-f, --function <name>',
        'Name of the function to deploy')
      .action(actionWrapper(deployHandler, true));

    commander
      .command('remove')
      .description('Remove a previously deployed function')
      .option('-f, --function <name>',
        'Name of the function to remove')
      .action(actionWrapper(removeHandler, true));

    commander
      .command('invoke')
      .description('Invoke a Binaris function')
      .option('-f, --function <name>',
        'Name of the function to invoke')
      .option('-d, --data <data>', 'Data to send with invocation')
      .option('-j, --json <filePath>', 'Path to file containing JSON data')
      .action(actionWrapper(invokeHandler, true));

    commander
      .command('*', null, { noHelp: true })
      .description('')
      .action(actionWrapper(unknownHandler, false));

    commander
      .parse(input);

    if (!input.slice(2).length) {
      commander.outputHelp();
    }
  });
  return exitCode;
};

module.exports = runCLI;
