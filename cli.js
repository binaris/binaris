const yargs = require('yargs');
const moniker = require('moniker');

const logger = require('./lib/logger');
const { makeNameValid } = require('./lib/nameUtil');
const { deployHandler, createHandler, invokeHandler,
  logsHandler, loginHandler, removeHandler } = require('./lib');

const handleCommand = async function handleCommand(options, specificHandler) {
  const numArgs = options._.length;
  if (numArgs > 1) {
    yargs.showHelp();
    logger.error('Too many positional args given for command');
    process.exit(1);
  }

  if (!options.function) {
    yargs.showHelp();
    logger.error('A valid function name is a required argument');
    if (options._[0] === 'create') {
      logger.error('The "create" command allows for the --random(r) flag in lieu of a name');
    }
    process.exit(1);
  }
  await specificHandler(options);
  process.exit(0);
};

yargs
  .option('path', {
    alias: 'p',
    describe: 'Use directory dir. "create" will create this directory if needed.',
    type: 'string',
    global: true,
  })
  .usage(
`Binaris command line interface

Usage: $0 <command> [options]` // eslint-disable-line comma-dangle
  )
  .command('create [function] [options]', 'Create a function from template', (yargs0) => {
    yargs0
      .usage('Usage: $0 create [function] [options]')
      .positional('function', {
        describe: 'Name of the function to generate',
        type: 'string',
      })
      .option('random', {
        alias: 'r', describe: 'Generate a random name for your function', type: 'boolean',
      });
  }, async (argv) => {
    if (argv.random) {
      // eslint-disable-next-line no-param-reassign
      argv.function = makeNameValid(moniker.choose());
    }
    await handleCommand(argv, createHandler);
  })
  .command('deploy <function> [options]', 'Deploys a function to the cloud', (yargs0) => {
    yargs0
      .usage('Usage: $0 deploy <function> [options]')
      .positional('function', {
        describe: 'Name of the function to deploy',
        type: 'string',
      });
  }, async (argv) => {
    await handleCommand(argv, deployHandler);
  })
  .command('remove <function> [options]', 'Remove a previously deployed function', (yargs0) => {
    yargs0
      .usage('Usage: $0 remove <function> [options]')
      .positional('function', {
        describe: 'Name of the function to remove',
        type: 'string',
      });
  }, async (argv) => {
    await handleCommand(argv, removeHandler);
  })
  .command('invoke <function> [options]', 'Invoke a Binaris function', (yargs0) => {
    yargs0
      .usage('Usage: $0 invoke <function> [options]')
      .positional('function', {
        describe: 'Name of the function to invoke',
        type: 'string',
      })
      .option('json', {
        alias: 'j',
        describe: 'Path to file containing JSON data',
        type: 'string',
      })
      .option('data', {
        alias: 'd',
        describe: 'Data to send with invocation',
        type: 'string',
      });
  }, async (argv) => {
    await handleCommand(argv, invokeHandler);
  })
  .command('logs <function> [options]', 'Print the logs of a function', (yargs0) => {
    yargs0
      .usage('Usage: $0 logs <function> [options]')
      .positional('function', {
        describe: 'Name of the function to retrieve logs for',
        type: 'string',
      })
      .option('tail', {
        alias: 't',
        describe: 'Outputs logs in "tail -f" fashion',
        type: 'boolean',
      });
  }, async (argv) => {
    await handleCommand(argv, logsHandler);
  })
  .command('login', 'Login to your Binaris account using an API key', (yargs0) => {
    yargs0
      .usage('Usage: $0 login');
  }, async () => {
    await loginHandler();
  })
  // .strict()
  .demand(1, 'Please provide at least 1 valid command')
  .help('help')
  .alias('help', 'h')
  .wrap(null);

const commands = yargs.getCommandInstance().getCommands();
const argv = yargs.argv;

if (argv._[0] && commands.indexOf(argv._[0]) === -1) {
  logger.error(`Unknown command: '${argv._[0]}'. See 'bn --help'`);
  process.exit(1);
}

