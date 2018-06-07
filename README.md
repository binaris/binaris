# Binaris

**[Binaris](https://www.binaris.com/)** is a fast, low-latency FaaS (Function as a Service) platform. With our performance and scale, you can run real production workloads on Node.js.

## Getting up and running in seconds

1. Install using npm
```bash
npm install -g binaris
```

2. Setup Binaris credentials
    - If you already have an account it's as simple as exporting your existing credentials
    - Otherwise head over to [Binaris](https://www.binaris.com/) to sign up

3. Generate a Binaris template function
```bash
# generates simple NodeJS template function
bn create node8 hellofunc
```

4. Deploy a function
```bash
# makes the function available via Binaris cloud
bn deploy hellofunc
```

5. Invoke a function
```bash
# calls the function endpoint via https
bn invoke hellofunc
```

6. Make changes to a function
```bash
git diff
--- a/function.js
+++ b/function.js

-    console.log('Hello World');
+    console.log('Hello Binaris');

# redeploy the function
bn deploy hellofunc
```

7. Get logs for a function
```bash
bn logs hellofunc
```

It's as simple as that.

## Running without Node & NPM

There's a docker version of the Binaris CLI, published on Dockerhub as [binaris/bn](https://hub.docker.com/r/binaris/bn/).

### Usage

To run in the current directory:

```bash

docker run --rm -v $(pwd):/src binaris/bn --help

```

You'll want to forward your API key. So add `-e BINARIS_API_KEY` like so:

```bash

docker run --rm -e BINARIS_API_KEY -v $(pwd):/src binaris/bn

```

For convenience, you can create an alias for this in bash:

```bash

alias bn='docker run --rm -e BINARIS_API_KEY -v $(pwd):/src binaris/bn'
bn create node8 hello
bn deploy hello
bn invoke hello

```

## Storing secrets and other configuration parameters

You can pass configuration parameters to functions as part of the `deploy` command. These parameters will be available to the function during runtime as environment variables. All parameters are encrypted at rest and in-transit, which makes them the preferred way to store API keys, passwords, etc.

To pass parameters into a function, add an `env:` section to `binaris.yml`, like so:

```yaml
functions:
  hello:
    file: function.js
    entrypoint: handler
    runtime: node8
    env:
      SOME_API_KEY: XXXXXXXXXXX
```

If a parameter is sensitive and you don't want to commit it to SCM, you can leave out the value in `binaris.yml`:

```yaml
functions:
  hello:
    file: function.js
    entrypoint: handler
    runtime: node8
    env:
      SOME_API_KEY:
```

And pass it as an environment variable to the `deploy` command:

You can then access these parameters as environment variables:

`function.js`

```js
exports.handler = () => {
  const apiKey = process.env.SOME_API_KEY;
  // ...
}
```

Or in Python:

```python
import os

def handler(body, req):
    apiKey = os.environ['SOME_API_KEY']
    # ...
```

Only string values are supported in the `env:` section.

```bash
SOME_API_KEY=XXXXXXX bn deploy hello
```

Learn more about the Binaris platform at the [developer resources](https://dev.binaris.com/) page.

This project is licensed under the terms of the MIT license

