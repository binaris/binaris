const Docker = require('dockerode');
const docker = new Docker();

const strip = require('strip-color');
const PassThroughStream = require('stream').PassThrough;
const msleep = require('./msleep');

// interval(in ms) to check whether the current command
// has finished running
const msCmdPollInterval = 50;
const startCommand = 'bash';

class Container {
  /**
   * Creates a container handle with the specified Docker image.
   *
   * @param {string} imageName - docker image name to use when creating this container
   */
  constructor(imageName) {
    if (!imageName) {
      throw new Error('Image name must be provided');
    }
    this.imageName = imageName;
    // eventually holds the stdio of the docker container
    this.outDialog = [];
    this.errDialog = [];
    this.joinedDialog = [];
    // streams are demuxed so separate err/out is required
    this.outStream = new PassThroughStream();
    this.errStream = new PassThroughStream();
    this.started = false;
  }

  /**
   * Starts a container based on the image name provided
   * when this instance was intialized. The container
   * must be removed before exiting your application or it
   * will be left dangling.
   */
  async startContainer() {
    this.container = await docker.createContainer({
      Image: this.imageName,
      Cmd: [startCommand],
      Privileged: false, // by default don't allow docker access inside
      Tty: false, // allocating the TTY completes messes up docker headers
      OpenStdin: true,
      StdinOnce: false,
    });
    const self = this;
    const processPayload = function processPayload(payload, output) {
      // the colors and trailing newline should both be removed
      const strippedPayload = strip(payload.toString()).slice(0, -1);
      // bug with dockerode/node/readline sometimes spits crap on stdin
      if (strippedPayload !== '') {
        if (!isNaN(Number.parseInt(strippedPayload, 10))) {
          self.exitCode = strippedPayload;
        } else {
          output.push(strippedPayload);
          // regardless of err/out it goes into the joinedDilog
          self.joinedDialog.push(strippedPayload);
        }
      }
    };
    // handle all stdout from the readside of our HTTPDuplex
    this.outStream.on('data', (chunk) => {
      processPayload(chunk, this.outDialog);
    });
    // handle all stderr from the readside of our HTTPDuplex
    this.errStream.on('data', (chunk) => {
      processPayload(chunk, this.errDialog);
    });

    // attach to the newly created container w/ all stdio
    this.dockerStream = await this.container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });
    // separates out stderr/stdout, this can also be done manually with the headers
    this.container.modem.demuxStream(this.dockerStream, this.outStream, this.errStream);
    // start the container and wait for the startup command to finish
    await this.container.start();
    this.started = true;
  }

  /**
   * Streams a series of inputlines to the shell of
   * this Docker container. The lines are required to
   * generate a single bash exit code. The only real case
   * where it makes sense to send more than 1 at once is
   * for interacting with stdin.
   *
   * @param {array} inputLines - lines of input that will be fed to the Container
   * @returns {object} - object containing output and error code of your input lines
   */
  async streamIn(inputLine) {
    if (!this.started) {
      throw new Error('Container must be started before streaming into it');
    }
    // set to undefined so streamed input doesn't
    // return until an exit code has been received
    this.exitCode = undefined;
    this.dockerStream.write(`${inputLine}\n`);
    // grabs exit code of last command executed in the shell
    this.dockerStream.write('echo $?\n');
    // Because some commands have no stdio it's safer
    // to wait for the exit code to be printed.
    while (this.exitCode === undefined) {
      // eslint-disable-next-line no-await-in-loop
      await msleep(msCmdPollInterval);
    }
    return this.flushOutput();
  }

  /**
   * Flushes all of the collected output(stderr/stdout).
   * To receive a non-empty array, actions must have been
   * previously streamed to the container using 'streamIn'
   *
   * @returns {object} - object holding stdout/stderr and an exit code
   */
  flushOutput() {
    const output = {
      // array spread allows for a fast and efficient deep copy
      // join all output lines with \n
      output: [...this.joinedDialog].join('\n'),
      stdout: [...this.outDialog].join('\n'),
      stderr: [...this.errDialog].join('\n'),
      exitCode: parseInt(this.exitCode, 10),
    };
    // flush
    this.joinedDialog.length = 0;
    this.errDialog.length = 0;
    this.outDialog.length = 0;
    return output;
  }

  /**
   * Attempts to stop and then kill this container.
   */
  async stopAndKillContainer() {
    if (this.container && this.started) {
      await this.container.stop();
      await this.container.remove();
    }
  }
}

module.exports = Container;

