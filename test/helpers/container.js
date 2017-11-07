const { execBash } = require('./spawnUtils');
const uuidv4 = require('uuid/v4');

class Container {
  /**
   * Creates a container handle with the specified Docker image name,
   * sudo user password and mount directory. The mount directory is
   * the location where the persistent volume should be mounted in the container.
   *
   * @param {string} imgName - the docker image name to use when creating this container
   * @param {string} sudoPassword - the password for the sudo user of the image
   * @param {string} mountDir - the dir to mount a volume on in the container
   */
  constructor(imgName, sudoPassword, mountDir) {
    this.sudoCommand = `echo ${sudoPassword} | sudo -S `;
    this.imgName = imgName;
    this.mountDir = mountDir;
  }

  /**
   * Creates a container with imgName and a defined volume.
   * The container will last until removed as there is no
   * Object lifetime management in JS.
   *
   * @param {string} flags - extra flags to pass to create
   */
  async create(flags) {
    if (this.volumeName) {
      throw new Error('Container has already been created!');
    }
    this.volumeName = `${this.imgName}${uuidv4().slice(0, 8)}`;
    const create = await execBash(
`docker create -v ${this.mountDir} --name ${this.volumeName} \
${flags || ''} ${this.imgName} /bin/true`, false);
    this.ID = create.slice(0, -1);
    return this.ID;
  }

  /**
   * Removes previously created container. Volume
   * and all data will be lost in the process.
   *
   * @param {string} flags - extra flags to pass to remove
   */
  async remove(flags) {
    if (!this.volumeName) {
      throw new Error('Container has already been removed!');
    }
    const removed = await execBash(`docker rm ${flags || ''} ${this.ID}`, false);
    this.volumeName = undefined;
    this.ID = undefined;
    return removed;
  }

  /**
   * Gives the user and optional group access to the mounted
   * volume of this container.
   *
   * @param {string} user - ubuntu user to give volume access to
   * @param {string} group - ubuntu group to give volume access to
   * @returns {string} - the output of the access modification attempt
   */
  async giveUserVolumeAccess(user, group) {
    const chownVolume =
`${this.sudoCommand}chown ${user}${group ? ':' + group : ''} ${this.mountDir} > /dev/null 2>&1`;
    const chmodVolume =
`${this.sudoCommand}chmod 700 ${this.mountDir} > /dev/null 2>&1`;
    return this.run('', `${chownVolume} && ${chmodVolume}`, false);
  }

  /**
   * Runs your docker container and attempts to invoke the provided
   * command via bash. You will either receive and error object with
   * the stdout, stderr and exit code or the stdout and an implied
   * success.
   *
   * @param {string} flags -  extra flags to pass to run
   * @param {string} runArgs - the run arguments to pass to bash
   * @returns {object} - stdout of your run
   */
  async run(flags, runArgs, color = false) {
    if (!this.volumeName) {
      throw new Error('Please create container before trying to use run!');
    }
    return execBash(
  `docker run --volumes-from ${this.volumeName} ${flags} ${this.imgName} bash -c \
  "cd ${this.mountDir} && ${runArgs}"`, color);
  }

  /**
   * Checks whether this container has beeen created.
   *
   * @returns - whether or not this container has been created
   */
  isCreated() {
    return (this.volumeName !== undefined);
  }
}

module.exports = Container;

