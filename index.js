const { existsSync, lstatSync, readdirSync } = require('fs');
const { join } = require('path');

const exposeHostedApps = (mainApp, hostedApps) => {
    return Promise.all(hostedApps.map(hostedApp => {
        try {
            const getExpressHostedApp = require(hostedApp.expressAppFile);
            const expressHostedApp = getExpressHostedApp(hostedApp.variables);
            if (!(expressHostedApp instanceof Promise)) {
                mainApp.use(`/${hostedApp.name}`, expressHostedApp);
                console.log(`Successfully exposed ${hostedApp.name}`);
                return Promise.resolve(1);
            }
            else {
                return expressHostedApp
                    .then(deferredExpressHostedApp => {
                        mainApp.use(`/${hostedApp.name}`, deferredExpressHostedApp);
                        console.log(`Successfully exposed ${hostedApp.name}`);
                        return 1;
                    })
                    .catch(error => {
                        console.log(`Error exposing ${hostedApp.name} app`, error);
                        return 0;
                    });
            }
        }
        catch (error) {
            console.log(`Error exposing ${hostedApp.name} app`, error);
            return Promise.resolve(0);
        }
    }))
    .then(results => {
        const exposedAppsNumber = results.reduce((reduced, result) => reduced + result, 0);
        console.log(`Exposed ${exposedAppsNumber} apps in total!`);
    });
};

const getAppEnvironmentPrefix = appName => appName.toUpperCase().replace(/-/g,'_') + '__';

const getAvailableApps = (appsPath, doLoadEnvironmentVariables = true) => {
    if (!appsPath) {
        console.error('No apps path was provided');
        return [];
    }

    let apps = getDirectoriesName(appsPath)
        .map(appName => {
            const appPath = join(appsPath, appName);

            let modenaAppConfig = {};
            const modenaAppConfigPath = join(appPath, 'modena.json');
            if (existsSync(modenaAppConfigPath)) {
                modenaAppConfig = require(modenaAppConfigPath);
            }

            const app = {
                expressAppFile: join(appPath, modenaAppConfig.expressAppFile || 'get-express-app.js'),
                isDefaultApp: false,
                name: appName,
                path: appPath,
                publicDomains: modenaAppConfig.publicDomains || []
            };
            return app;
        })
        .filter(app => existsSync(app.expressAppFile));

    if (doLoadEnvironmentVariables) {
        apps = loadEnvironmentVariables(apps);
    }

    return apps;
};

const getDirectoriesName = path =>
    readdirSync(path).filter(name => lstatSync(join(path, name)).isDirectory());

const getRenderIsolator = appsPath => (req, res, next) => {
    if (req.__modenaApp) {
        const renderFunction = res.render.bind(res);
        res.render = (viewName, options) => {
            const viewPath = join(appsPath, req.__modenaApp.name, 'views', viewName);
            renderFunction(viewPath, options);
        }
    }
    next();
};

const resolveThroughDefaultApp = (apps) => {
    const matchingApps = resolveThroughNonUniqueCriteria(apps, app => app.isDefaultApp);
    if (matchingApps.count > 1) {
        console.log(`   Conflict! [${matchingApps.apps.map(app => app.name).join(', ')}] apps are all set as default`);
    }

    const accessedApp = matchingApps.apps[0];
    if (!accessedApp) {
        console.log(`   No default app was set`);
    }
    else {
        console.log('   Request resolved through default app:', accessedApp.name);
    }

    return accessedApp;
}

const resolveThroughDomain = (apps, domain) => {
    const matchingApps = resolveThroughNonUniqueCriteria(apps, app => app.publicDomains.find(d => d === domain));
    if (matchingApps.count > 1) {
        console.log(`   Conflict! [${matchingApps.apps.map(app => app.name).join(', ')}] apps are all matching to ${domain}`);
    }

    const accessedApp = matchingApps.apps[0];
    if (!accessedApp) {
        console.log(`   Unable to match the public domain (${domain}) to any app`);
    }
    else {
        console.log('   Request resolved through public domain:', accessedApp.name);
    }

    return accessedApp;
};

const resolveThroughNonUniqueCriteria = (apps, criteria) => {
    const matchingApps = apps.reduce((reduced, app) => {
        if (criteria(app)) {
            ++reduced.count;
            reduced.apps.push(app);
        }
        return reduced;
    }, {
        count: 0,
        apps: []
    });

    return matchingApps;
}

const resolveThroughQueryParameters = (apps, query) => {
    let accessedApp = undefined;
    if (query && query.$modena) {
        accessedApp = apps.find(app => app.name === query.$modena);
        if (!accessedApp) {
            console.log(`   Unable to match the $modena query parameter (${query.$modena}) to any app`);
        }
        else {
            console.log('   Request resolved through $modena query parameter:', accessedApp.name);
        }
    }
    else {
        console.log('   No $modena query parameter was provided');
    }
    return accessedApp;
}

const resolveThroughUrlPathname = (apps, url) => {
    const accessedApp = apps.find(app => url.startsWith(`/${app.name}`));
    if(!accessedApp) {
        console.log(`   Unable to match the url pathname (${url}) to any app`);
    }
    else {
        console.log('   Request resolved through url pathname:', accessedApp.name);
    }
    return  accessedApp;
}

const getRequestResolver = apps => (req, res, next) => {
    console.log(`Accessing ${req.url}...`);
    req.__modenaApp = undefined;

    req.__modenaApp = resolveThroughDomain(apps, req.headers.host);    
    // TODO Take into consideration allowCrossAccess for public domains
    req.__modenaApp = req.__modenaApp || resolveThroughQueryParameters(apps, req.query);
    req.__modenaApp = req.__modenaApp || resolveThroughUrlPathname(apps, req.url);
    req.__modenaApp = req.__modenaApp || resolveThroughDefaultApp(apps);

    if (req.__modenaApp) {
        const namespacePrefix = '/' + req.__modenaApp.name;
        if (!req.url.startsWith(namespacePrefix)) {
            req.url = namespacePrefix + req.url;
            console.log(`   Request url updated: ${req.url}`);
        }
    }
    else {
        console.log('   The request could not be resolved to any app');
    }

    next();
};

const loadEnvironmentVariables = apps => {
    const appsEnvironment = apps.map(app => ({
        config: app,
        prefix: getAppEnvironmentPrefix(app.name),
        variables: {}
    }));
    
    Object.keys(process.env).forEach(envKey => {
        appsEnvironment.forEach(appEnvironment => {
            if (envKey.startsWith(appEnvironment.prefix)) {
                appEnvironment.variables[envKey.replace(appEnvironment.prefix, '')] = process.env[envKey];
                delete process.env[envKey];
            }
        });
    });

    const appsEnvironmentVariables = appsEnvironment.map(app => ({
        ...app.config,
        variables: app.variables
    }));
    return appsEnvironmentVariables;
};

const setDefaultApp = (apps, defaultAppName) => {
    const isThereSomeDefaultApp = apps.reduce((reduced, app) => {
        app.isDefaultApp = app.name === defaultAppName;
        return reduced || app.isDefaultApp;
    }, false);

    if(!isThereSomeDefaultApp) {
        console.log(`Error setting the default app: there is no app named ${defaultAppName}`);
    }
};

module.exports = {
    exposeHostedApps,
    getAvailableApps,
    getRenderIsolator,
    getRequestResolver,
    loadEnvironmentVariables,
    setDefaultApp
};
