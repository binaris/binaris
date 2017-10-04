# Binaris CLI
The Binaris CLI allows more convenient access to the Binaris experience
## Getting started
#### What you need to get started
* NodeJS version >= 8.0
* NPM version >= 4.0
#### Installing
    npm install -g binaris
#### Create your own Binaris function
  ```bash
  # First you need to initialize a function with the default template
  bn init --functionName myFirstFunction --path somePath
  # Now navigate to the newly created dir for your function
  cd myFirstFunction
  ```
#### Deploy your function
  ```bash
  # Once you're inside your functions dir simply...
  bn deploy
  ```
#### Invoking your function
  ```bash
  bn invoke
  ```
