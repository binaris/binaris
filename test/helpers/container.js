const Docker = require('dockerode');
const docker = new Docker();

const uuidv4 = require('uuid/v4');
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

    // handle all stdout from the readside of the HTTPDuplex
    this.outStream.on('data', (chunk) => {
      const rawPayload = chunk.toString().slice(0, -1);
      if (rawPayload !== '') {
        // every stdout line received is checked to see if
        // it could signal an end of command sequence. The
        // sequence is uniquely generated for each command.
        if (rawPayload.length >= this.cmdUUID.length + 1) {
          const possibleUUID = rawPayload.slice(-8);
          if (possibleUUID === this.cmdUUID) {
            // the UUID is only 8 characters, the rest is
            // the exit code
            this.exitCode = rawPayload.slice(0, -8);
            this.cmdUUID = undefined;
          }
        }
        if (this.cmdUUID !== undefined) {
          this.outDialog.push(rawPayload);
          this.joinedDialog.push(rawPayload);
        }
      }
    });
    // handle all stderr from the readside of the HTTPDuplex
    this.errStream.on('data', (chunk) => {
      const rawPayload = chunk.toString().slice(0, -1);
      if (rawPayload !== '') {
        this.errDialog.push(rawPayload);
        this.joinedDialog.push(rawPayload);
      }
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
   * @param {string} inputLine - line of input that will be fed to the Container
   * @returns {object} - object containing output and error code of your input lines
   */
  async streamIn(inputLine) {
    if (!this.started) {
      throw new Error('Container must be started before streaming into it');
    }
    // unqiue sequence that until received by stdout
    // will cause this function to be block
    this.cmdUUID = uuidv4().slice(0, 8);
    this.dockerStream.write(`${inputLine}\n`);
    // grabs exit code of last command executed in the shell
    // the UUID ensures that we don't misinterpret it
    this.dockerStream.write(`echo $?${this.cmdUUID}\n`);
    // Because some commands have no stdio it's safer
    // to wait for the exit code to be printed.
    while (this.cmdUUID !== undefined) {
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

