const { spawn } = require('child_process');
const strip = require('strip-color');

/**
 * Wrapper for the child_process spawn call which
 * conveniently provides us access to stderr, stdout and
 * any error codes/failures that occurred during the run
 * of the child process.
 */
function spawnWrapper(command, cmdArgs, debugId = '', options = {}) {
  function resolveOrReject(resolve, reject, RC) {
    if (RC.code || RC.signal) return reject(RC);
    return resolve(RC);
  }
  const RC = {
    code: null,
    stdout: '',
    stderr: '',
    output: '',
  };
  let cmd;
  const cmdPromise = new Promise((resolve, reject) => {
    let done = false;
    cmd = spawn(command, cmdArgs, options);
    const drainStream = (stream) => {
      let chunk;
      // eslint-disable-next-line no-cond-assign
      while ((chunk = cmd[stream].read()) !== null) {
        RC[stream] += chunk;
      }
    };

    const drainStreams = () => {
      /*
       * do not call this before the program is dead,
       * otherwise order is an issue and can deadlock
       * TODO: refactor into promises
       */
      ['stderr', 'stdout'].forEach(drainStream);
    };

    cmd.stderr.on('data', (data) => {
      RC.stderr += data;
    });
    cmd.stdout.on('data', (data) => {
      RC.stdout += data;
    });

    cmd.on('exit', (code, signal) => {
      if (done) return;
      RC.code = code;
      RC.signal = signal;
    });

    cmd.on('close', (code, signal) => {
      if (done) return;

      drainStreams();
      RC.code = RC.code || code;
      RC.signal = RC.signal || signal;
      done = true;
      resolveOrReject(resolve, reject, RC);
    });
  });
  cmdPromise.child = cmd;
  return cmdPromise;
}

/**
 * Simple wrapper that execs the specified arguments via bash.
 *
 * @param {string} command - the command to execute
 * @param {boolean} color - whether bash should ouput w/ colors
 * @returns - the stdout of your bash invocation
 */
const execBash = async function execBash(args, stripColor = false) {
  try {
    const spawnOut = await spawnWrapper('bash', ['-c', args], '');
    return stripColor ? strip(spawnOut.stdout) : spawnOut.stdout;
  } catch (err) {
    const newError = {
      stdout: stripColor ? strip(err.stdout) : err.stdout,
      stderr: stripColor ? strip(err.stderr) : err.stderr,
      code: err.code,
    };
    throw newError;
  }
};

module.exports = {
  execBash,
  spawnWrapper,
};
