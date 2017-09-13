const init = async function (data) {
  const completionObj = {
    success: true,
  };

  if (data.serviceName && data.servicePath) {
    return completionObj;
  }

  completionObj.success = false;
  completionObj.error = 'invalid service path or service name provided!';
  return completionObj;
};

module.exports = init;
