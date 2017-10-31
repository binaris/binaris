// grab the version to keep things consistent
const { version } = require('./package.json');
const { initHandler, deployHandler, removeHandler,
   invokeHandler, unknownHandler } = require('./cli-sdk');

const runCLI = async function runCLI(input) {
  delete require.cache[require.resolve('commander')];
  // eslint-disable-next-line global-require
  const commander = require('commander');
  const result = new Promise((resolve) => {
    const actionWrapper = function actionWrapper(action) {
      const aWrapper = async function aWrapper(...args) {
        const actionResult = await action(...args);
        resolve(actionResult);
      };
      return aWrapper;
    };

    commander
      .version(version)
      .description('Binaris command line interface');

    commander
      .command('init')
      .description('Initialize a function from template')
      .option('-f, --functionName <functionName>', 'name for the generated fucntion (if omitted, a name will be chosen at random)')
      .option('-p, --path <path>', 'directory for the generated function (default is cwd)')
      .action(actionWrapper(initHandler));

    commander
      .command('deploy')
      .description('Deploys a function to the cloud')
      .option('-p, --path <path>', 'path to function direcotry (where binaris.yml is)')
      .action(actionWrapper(deployHandler));

    commander
      .command('remove')
      .description('Remove a function from the cloud')
      .option('-f, --functionName <functionName>', 'name of function to remove')
      .option('-p, --path <path>', 'path to function')
      .action(actionWrapper(removeHandler));

    commander
      .command('invoke <functionName>')
      .description('Invoke a function on the cloud')
      .option('-p, --path <path>', 'path to function')
      .option('-j, --json <json>', 'JSON data to pass as event.body')
      .option('-f, --filePath <filePath>', 'path to a JSON file containing data to pass as event.body')
      .action(actionWrapper(invokeHandler));

    commander
      .command('*', null, { noHelp: true })
      .description('')
      .action(actionWrapper(unknownHandler));

    commander.parse(input);
    if (!input.slice(2).length) {
      commander.outputHelp();
    }
  });

  return result;
};

module.exports = runCLI;
