# Deployment specification

## Contents of tgz
### A tgz file containing the following items will be sent

	function-name.tgz
	  -- <function-file>.js
      -- function.json


### function.json
	{
	  "file": "<users-js-file>",
	  "entrypoint": "<users-entry-point>"
	}
#### Information to extract
You will need to extra the following field from this file

**file** - specifies which Javascript file contains the entry point

**entrypoint** - specifies the function to invoke in our main JS file

### function.js
This is the the vanilla template for the '<function-file\>.js' file
See [function.js](sdk/init/functionTemplates/nodejs/function.js)

Clearly nothing needs to be extracted from this file, but it is important to note that the `hello` in the signature varies based on the entrypoint extracted from `function.json`

