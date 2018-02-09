# Binaris

**[Binaris](https://www.binaris.com/)** is a fast, low-latency FaaS (Function as a Service) platform. With our performance and scale, you can run real production workloads on Node.js.

### <a name="up-and-running"></a>Getting up and running in seconds

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
bn create hellofunc
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


[Dev resources](https://dev.binaris.com/)

This project is licensed under the terms of the MIT license
