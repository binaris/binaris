class HTTPError extends Error {
  constructor(response) {
    super(response.statusMessage);
    this.response = response;
  }
}

function makeHTTPError(rawError) {
  const body = Object.assign({}, rawError, { errorCode: rawError.error.errorCode });
  const response = {
    errorCode: rawError.error.errorCode,
    statusCode: rawError.statusCode,
    statusMessage: rawError.message,
    body,
  };
  throw new HTTPError(response);
}

async function tryRequest(asyncReq) {
  try {
    const response = await asyncReq;
    return response;
  } catch (err) {
    console.log(JSON.stringify(err, null, 2));
    if (err.statusCode < 200 || err.statusCode >= 300) {
      makeHTTPError(err);
    }
    throw err;
  }
}

module.exports = {
  HTTPError,
  tryRequest,
};
