# Deployment specification

## Contents of tgz
### A tgz file containing the following items will be sent

	function-name.tgz
	  -- <function-file>.js
      -- package.json
      -- function.json


### package.json
This is the template for a functions package.json file. By the time of deployment the user could(and most likely will) make many additions and modifications to this file.
See [package.json](sdk/init/functionTemplates/nodejs/package.json)

#### Information to extract

You will need to extra the following field from this file

**main** - specifies which Javascript file contains the entry point

### function.json
	{
	  "entrypoint": "<users-entry-point>"
	}
#### Information to extract
You will need to extra the following field from this file

**entrypoint** - specifies the function to invoke in our main JS file

### function.js
This is the the vanilla template for the '<function-file\>.js' file
See [function.js](sdk/init/functionTemplates/nodejs/function.js)

Clearly nothing needs to be extracted from this file, but it is important to note that the `hello` in the signature varies based on the entryPoint extracted from `function.json`

