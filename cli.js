'use strict';

const yargs = require('yargs');

const logger = require('./lib/logger');
const { getRealm } = require('./lib/userConf');
const { parseTimeString } = require('./lib/timeUtil');
const {
  deployHandler, createHandler, feedbackHandler, invokeHandler,
  listHandler, logsHandler, loginHandler, removeHandler, perfHandler,
  showHandler, statsHandler,
} = require('./lib');
const { forceRealm } = require('./sdk');

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
  const realm = await getRealm();
  if (realm) {
    forceRealm(realm);
  }

  await specificHandler(options);
  process.exit(0);
};

const runtimes = require('./lib/runtimes');

const executionModels = ['exclusive', 'concurrent'];

const pathOption = ['path', {
  alias: 'p',
  describe: 'Use directory dir.',
  type: 'string',
}];

yargs
  .usage( // eslint-disable-next-line indent
`Binaris command line interface

Usage: $0 <command> [options]` // eslint-disable-line comma-dangle
  )
  .command('create <runtime> <function> [options]', 'Create a function from template', (yargs0) => {
    yargs0
      .usage('Usage: $0 create <runtime> <function> [options]')
      .positional('runtime', {
        choices: runtimes,
        type: 'string',
      })
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      })
      .option('config', {
        describe: 'Function configuration',
      })
      .option('executionModel', {
        alias: 'e',
        choices: executionModels,
        describe: 'Execution model for your function',
        hidden: true,
      })
      .option('path', {
        alias: 'p',
        describe: 'Use directory dir. "create" will create this directory if needed.',
        type: 'string',
      })
      .strict()
      .example( // eslint-disable-next-line indent
` // Create a function from python3 template
  bn create python3 ninja

  // Create a function from node8 template with exclusive execution model
  bn create node8 pirate --config.executionModel=exclusive

  // Create a function from python2 template with concurrent execution model, and FOO env
  bn create python2 hello --config.executionModel=concurrent --config.env.FOO=bar

  // Create a function from python3 template with deploy time BAR env
  bn create python2 hello --config.env.BAR
`);
  }, async (argv) => {
    // validating here and not in coerce to keep output consistent
    if (argv.config !== undefined) {
      const configType = typeof argv.config;
      if (configType !== 'object' || Array.isArray(argv.config)) {
        msgAndExit(`Non object create configuration options: ${argv.config}`, true);
      }
      // transform boolean true  for --config.env.VAR to work properly
      if (argv.config.env && typeof argv.config.env === 'object') {
        for (const v in argv.config.env) {
          if (argv.config.env[v] === true) {
            // eslint-disable-next-line no-param-reassign
            argv.config.env[v] = null;
          }
        }
      }
    }
    await handleCommand(argv, createHandler);
  })
  .command('deploy <function> [options]', 'Deploys a function to the cloud', (yargs0) => {
    yargs0
      .usage('Usage: $0 deploy <function> [options]')
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      })
      .option(...pathOption)
      .strict();
  }, async (argv) => {
    await handleCommand(argv, deployHandler);
  })
  .command('remove <function> [options]', 'Remove a previously deployed function', (yargs0) => {
    yargs0
      .usage('Usage: $0 remove <function> [options]')
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      })
      .strict();
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
      })
      .strict()
      .example( // eslint-disable-next-line indent
`  // invoke a function
  bn invoke foo

  // invoke using JSON file data
  bn invoke foo --json ./path/to/myfile.json

  // invoke foo and send JSON data in the body
  bn invoke foo --data '{ "name": "helloworld" }'`);
  }, async (argv) => {
    await handleCommand(argv, invokeHandler);
  })
  .command('list [options]', 'List all deployed functions', (yargs0) => {
    yargs0
      .usage('Usage: $0 list [options]')
      .option('json', {
        describe: 'Output as JSON',
        type: 'boolean',
      })
      .strict();
  }, async (argv) => {
    await handleCommand(argv, listHandler);
  })
  .command('perf <function> [options]', 'Measure invocation latency (experimental)', (yargs0) => {
    yargs0
      .usage('Usage: $0 perf <function> [options]')
      .positional('function', {
        describe: 'Function name',
        type: 'string',
      })
      .option('maxRequests', {
        alias: 'n',
        describe: 'Number of invocations to perform',
        type: 'number',
        default: 5000,
      })
      .option('concurrency', {
        alias: 'c',
        describe: 'How many requests run concurrently',
        type: 'number',
        default: 1,
      })
      .option('data', {
        alias: 'd',
        describe: 'Data to include with performance invocations',
        type: 'string',
      })
      .option('maxSeconds', {
        alias: 't',
        describe: 'Maximum time in seconds',
        type: 'number',
      })
      .strict()
      .example( // eslint-disable-next-line indent
` // Run performance test on function foo (5000 invocations, serially)
  bn perf foo

  // Run performance test with 1,000 invocations
  bn perf foo -n 1000

  // Run performance test with 1,000 invocations and 4 concurrent connections
  bn perf foo -n 1000 -c 4

  // Run performance test with 1,000 invocations and send JSON data with each request
  bn perf foo -n 1000 -d '{ "someData": "myData" }'

  // Run performance test only up to 10 seconds
  bn perf foo -t 10
`);
  }, async (argv) => {
    await handleCommand(argv, perfHandler);
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
      })
      .option('since', {
        alias: 's',
        describe: 'Outputs logs after the given ISO timestamp',
        type: 'string',
      })
      .strict()
      .example( // eslint-disable-next-line indent
`  // retrieve all logs
  bn logs foo

  // tail all logs
  bn logs foo --tail

  // ISO
  bn logs foo --since 2018-03-09T22:12:21.861Z

  // unix
  bn logs foo --since 1520816105798

  // offset format
  bn logs foo --since 3d
  bn logs foo --since 13hours
  bn logs foo --since 9s`);
  }, async (argv) => {
    if (argv.since) {
      try {
        // eslint-disable-next-line no-param-reassign
        argv.since = parseTimeString(argv.since);
      } catch (err) {
        msgAndExit(err.message);
      }
    }
    await handleCommand(argv, logsHandler);
  })
  .command('stats [options]', /* hidden: 'Print usage statistics' */ false, (yargs0) => {
    yargs0
      .usage('Usage: $0 stats [options]')
      .option('since', {
        alias: 's',
        describe: 'Output statistics after given ISO timestamp (inclusive)',
        type: 'string',
      })
      .option('until', {
        alias: 'u',
        describe: 'Output statistics until given ISO timestamp (non-inclusive)',
        type: 'string',
      })
      .option('json', {
        describe: 'Output as JSON',
        type: 'boolean',
      })
      .strict()
      .example( // eslint-disable-next-line indent
`  // Retrieve all usage statistics of the account
  bn stats

  // Retrieve all statistics since the timestamp until now (~1 minute)
  bn stats --since 2018-03-09T22:12:21.861Z

  // Statistics over the last 24h
  bn stats --since 1d

  // Retrieve all statistics of a certain month
  bn stats --since 2018-03-01T00:00:00Z --until 2018-04-01T00:00:00Z`);
  }, async (argv) => {
    if (argv.since) {
      try {
        // eslint-disable-next-line no-param-reassign
        argv.since = parseTimeString(argv.since).toISOString();
      } catch (err) {
        msgAndExit(err.message);
      }
    }
    if (argv.until) {
      try {
        // eslint-disable-next-line no-param-reassign
        argv.until = parseTimeString(argv.until).toISOString();
      } catch (err) {
        msgAndExit(err.message);
      }
    }
    await handleCommand(argv, statsHandler);
  })
  .command('show [config]', 'Show Binaris account configuration', (yargs0) => {
    yargs0
      .usage('Usage: $0 show --all | <config>')
      .positional('config', {
        describe: 'What to show',
        choices: ['accountId', 'apiKey'],
      })
      .option('all', {
        alias: 'a',
        describe: 'Show it all',
        type: 'boolean',
      })
      .strict();
  }, async (argv) => {
    if (!argv.all && !argv.config) {
      msgAndExit('"bn show" requires positional arguments or the "--all" flag', true);
    }
    await handleCommand(argv, showHandler);
  })
  .command('login', 'Login to your Binaris account using an API key and account id', (yargs0) => {
    yargs0
      .usage('Usage: $0 login')
      .strict();
  }, async () => {
    await loginHandler();
  })
  .command('feedback <email> <message>', 'Provide feedback on the Binaris product', (yargs0) => {
    yargs0
      .usage('Usage: $0 feedback <email> <message>')
      .positional('email', {
        describe: 'User email',
        type: 'string',
      })
      .positional('message', {
        describe: 'Feedback message',
        type: 'string',
      })
      .example(
        `  // Send feedback message to us with your email address
          bn feedback "you@email.com" "Great Product!"`);
  }, async (argv) => {
    await handleCommand(argv, feedbackHandler);
  })
  // .strict()
  .demandCommand(1, 'Please provide at least 1 valid command')
  .help('help')
  .epilog(`Tip:
  You can export BINARIS_LOG_LEVEL=[silly|debug|verbose] to view debug logs`)
  .alias('help', 'h')
  .wrap(null);

const commands = yargs.getCommandInstance().getCommands();
// first command pushed to command stack(from user input)
const currCommand = yargs.argv._[0];

if (currCommand && commands.indexOf(currCommand) === -1) {
  msgAndExit(`Unknown command: '${currCommand}'`, true);
}

