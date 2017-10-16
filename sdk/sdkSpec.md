# Binaris-SDK Specification

## General usage

The Binaris-SDK is the direct way of interfacing with the Binaris runtime. It allows you to programatically deploy, invoke and remove Binaris functions.

# Available SDK actions

## Deploy
deploy(functionName, functionConfiguration, tarPath)

### Usage
Deploy is used both to initially upload your Binaris function and to update that same function in the future. Once deployed to the Binaris runtime you may invoke or remove the function by issuing a subsequent `invoke` or `remove` command. 

### Parameters

**functionName**: the name of the Binaris function you wish to deploy. Keep in mind that the name of the function you wish to deploy must be unique to your account.

**functionConfiguration**: a valid Binaris function configuration Object which defines critical metadata about your function. Below is an example of a simple and valid Binaris function configuration.

    // functions block required to define 1 or more functions
    "functions": {
        // name of the function you are deploying or plan to deploy
        "hello": {
            // the file which contains the entrypoint of your function
            "file": "function.js",
            // the entrypoint or main method of your function
            "entrypoint": "handler"
        }
    }

**tarPath**: path to the valid targz file of your function and its dependencies.

### Response

**On success**: <curlable invoke endpoint URL>

When the function is deployed successfully a String object representing the invokable Binaris endpoint is returned. You may use this URL to invoke your now deployed Binaris function via Curl. Alternatively you may also invoke your function using the invoke commands provided by the CLI and the SDK.

**On Failure**:

There are a number of reasons why the deploy operation can fail...

**When provided an invalid tgz file**

Exception: `Failed to upload function tar file to Binaris backend` 

**Binaris-runtime issues**

Exception: `Error deploying function: <statusCode> <error>`

## Invoke
invoke(functionName, functionData)

### Usage
Invoke is used to call a previously deployed Binaris function and receive its computed result.

### Parameters

**functionName**: the name of the Binaris function you wish to invoke. The name must refer to a Binaris function which has been previously deployed.

**functionData**: the Object you wish to pass to the invoked function as event data. This Object will be available to your remotely invoked function via its `event` parameter.

### Response

**On success**: <invoked function response>

When the function is invoked succesfully, you will receive the response Object you defined in your function and the statusCode contained in the response.

    {
        statusCode: <xxx>,
        body: <xxx>
    }

**On Failure**:

**When function invocation request fails**

Exception: `<invocation request error>`

## Remove
remove(functionName)

### Usage
Remove is used to delete a previously deployed Binaris function. Once removed you will no longer be able to interact(update/invoke) with the function remotely.

**Note**: This does not delete any local files.

### Parameters

**functionName**: the name of the Binaris function you wish to remove. The name must refer to a Binaris function which has been previously deployed.

### Response

**On success**: 

No response is given on successful removal.

**On Failure**:

**When removal request is invalid**

Exception: `<removal request error>`
    
**When Binaris function does not exist**

Exception: `Function <functionName> uknown`

**When non 200 status code is returned from removal request**

Exception: `Failed to remove function <functionName>`
