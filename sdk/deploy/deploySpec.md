# Deployment specification

## Contents of tgz
###A tgz file containing the following items will be sent

	function-name.tgz
	  -- <function-handler>.js 
      -- package.json
      -- function.json


### package.json
This is the template for a functions package.json file. By the time of deployment the user could(and most likely will) make many additions and modifications to this file.

	{
	  "name": "binaris-nodejs",
	  "version": "1.0.0",
	  "description": "Binaris Functions sample for the Serverless framework",
	  "main": "handler.js",
	  "keywords": [
	    "binaris",
	    "nodejs"
	  ],
	  "devDependencies": {
	  }
	}
#### Information to extract

You will need to extra the following field from this file

**main** - specifies which Javascript file contains the entry point

### function.json
	{
	  "entryPoint": "<users-entry-point>"
	}
#### Information to extract
You will need to extra the following field from this file

**entryPoint** - specifies the function to invoke in our main JS file
### handler.js
This is the the vanilla template for the '<function-handler\>.js' file

	module.exports.hello = function (event, context, callback) {
	  const response = {
	    statusCode: 200,
	    body: JSON.stringify({
	      message: '{UUID}',
	      input: event,
	      requestContext: context,
	    }),
	  };
	  callback(null, response);
	};
	
Clearly nothing needs to be extracted from this file, but it is important to note that the `hello` in the signature varies based on the entryPoint extracted from `function.json`
	