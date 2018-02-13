const yargs = require('yargs');

const logger = require('./lib/logger');
const { deployHandler, createHandler, invokeHandler,
  logsHandler, loginHandler, removeHandler } = require('./lib');

/**
 * Prints the provided message(along with optionally displayed help)
 * and then exits the process with a code of 1.
 *
 * @param message - string to print before exiting
 * @param displayHelp - should help be displayed before your error?
 */
const msgAndExit = function msgAndExit(message, displayHelp) {
  if (displayHelp) yargs.showHelp();
  logger.error(message);
  process.exit(1);
};

const handleCommand = async function handleCommand(options, specificHandler) {
  // eslint-disable-next-line no-param-reassign
  const cmdSeq = options._;
  // `_` is the array holding all commands given to yargs
  if (cmdSeq.length > 1) {
    msgAndExit(`Invalid subcommand ${cmdSeq[1]} for command ${cmdSeq[0]}`, true);
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
  .command('create <function> [options]', 'Create a function from template', (yargs0) => {
    yargs0
      .usage('Usage: $0 create <function> [options]')
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      });
  }, async (argv) => {
    await handleCommand(argv, createHandler);
  })
  .command('deploy <function> [options]', 'Deploys a function to the cloud', (yargs0) => {
    yargs0
      .usage('Usage: $0 deploy <function> [options]')
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      });
  }, async (argv) => {
    await handleCommand(argv, deployHandler);
  })
  .command('remove <function> [options]', 'Remove a previously deployed function', (yargs0) => {
    yargs0
      .usage('Usage: $0 remove <function> [options]')
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      });
  }, async (argv) => {
    await handleCommand(argv, removeHandler);
  })
  .command('invoke <function> [options]', 'Invoke a Binaris function', (yargs0) => {
    yargs0
      .usage('Usage: $0 invoke <function> [options]')
      .positional('function', {
        describe: 'Function name',
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
        describe: 'Function name',
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
// first command pushed to command stack(from user input)
const currCommand = yargs.argv._[0];

if (currCommand && commands.indexOf(currCommand) === -1) {
  msgAndExit(`Unknown command: '${currCommand}'`, true);
}

