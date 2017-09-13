/* eslint-disable no-param-reassign */

module.exports.hello = function (context) {
  context.log('JavaScript HTTP trigger function processed a request.');
  context.res = {
    body: 'Go Serverless v1.x! Your function executed successfully!',
  };
  context.done();
};
