# modena

Domain names are expensive and creating new deployment pipelines/scripts takes a precious time you could be dedicating to something else (e.g. learning [functional programming](https://drboolean.gitbooks.io/mostly-adequate-guide-old/content/)). Instead of having a separate environment for each of your express apps, use modena to expose all of them on a single express server while keeping them isolated from each other.

## What does it do?

It scans the apps directory of the project (configurable through the appsPath option) and exposes each existing app inside the host app, using the app folder name as unique namespace. Each app can then be accessed using the app name as relative url. Given the following file structure:

```bash
.
├── _apps
│   ├── _app-1
|   |    (...)
|   |    ├── get-express-app.js
|   |    ├── index.js
|   |    ├── package.json
|   |    └── package-lock.json
|   |    (...)
│   ├── _app-N
|   |    (...)
|   |    ├── get-express-app.js
|   |    ├── index.js
|   |    ├── package.json
|   |    └── package-lock.json
|   (...)
├── index.js
├── package.json
└── package-lock.json
```

The apps can be automatically exposed on a single server by placing the following code on the `index.js` file:

```
const express = require('express');
const { exposeHostedApps, launchServer } = require('modena');

const mainApp = express();

// exposeHostedApps returns a Promise, so that apps can be created asynchronously
exposeHostedApps(mainApp)
    .then(() => launchServer(mainApp, { port: 3000}))
    .catch(console.log);
```

So... that's it? Yes! In a nutshell. Additionally, modena offers some other methods to access the apps without prefixing the URLs with the app name:

-   \$modena query string parameter
-   Domain names mapping
-   Default app

TODO -> get-express-app file

## How does it work?

It detects all the express applications in the project folder and uses the express library ability to expose an app inside another app, as showcased below. On a real project, each app is created in its own file and directory, and the app folder name is used as its namespace:

```
const express = require('express');
const express = require('express-session');

/* The app that will actually be listening to network requests*/
const mainApp = express();

const app1 = express();
app1.use(/^\/$/, (req, res, next) => res.send('Application 1'));

const app2 = express();
app2.use(session({ secret: 'keyboard cat' }));
app2.use(/^\/$/, (req, res, next) => res.send(typeof req.session));

mainApp.use(/^\/$/, (req, res, next) => res.send('Main app'));

mainApp.use('/app-1', app1);
mainApp.use('/app-2', app2);

mainApp.listen(3000, error => {
    if (error) {
        console.log(error);
    }
    else {
        console.log('Server listening in port 3000');
    }
});
```

## Show me the mone... code!

Please visit the [examples repository](https://github.com/L3bowski/modena-v2-examples) to get a better understanding on how to use modena
