
const getApiKey = function getApiKey() {
  const apiKey = process.env.BINARIS_API_KEY;
  if (apiKey === undefined) {
    // TODO: read the user configuration file looking for the key
    throw new Error('Missing Binaris API key. Please set env var BINARIS_API_KEY');
  }
  return apiKey;
};

module.exports = { getApiKey };
