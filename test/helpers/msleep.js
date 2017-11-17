/**
 * Imitates stdc sleep behavior using es6 async/await
 *
 * @param {int} ms - the duration in milliseconds to sleep
 */
module.exports = function msleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};
