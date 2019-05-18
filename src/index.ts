import { existsSync, lstatSync, readdirSync } from 'fs';
import { join } from 'path';
import { NextFunction, Response, Application } from 'express';
import { MatchingItems, AppSettings, Dictionary, ModenaRequest } from './types';
export { MatchingItems, AppSettings, Dictionary, ModenaRequest };

export const exposeHostedApps = (mainApp: Application, appsSettings: AppSettings[]) => {
    return Promise.all(appsSettings.map(appSettings => {
        try {
            const getExpressHostedApp = require(appSettings.expressAppFile);
            const expressHostedApp = getExpressHostedApp(appSettings.envVariables);
            if (!(expressHostedApp instanceof Promise)) {
                mainApp.use(`/${appSettings.name}`, expressHostedApp);
                console.log(`Successfully exposed ${appSettings.name}`);
                return Promise.resolve(1);
            }
            else {
                return expressHostedApp
                    .then(deferredExpressHostedApp => {
                        mainApp.use(`/${appSettings.name}`, deferredExpressHostedApp);
                        console.log(`Successfully exposed ${appSettings.name}`);
                        return 1;
                    })
                    .catch(error => {
                        console.log(`Error exposing ${appSettings.name} app`, error);
                        return 0;
                    });
            }
        }
        catch (error) {
            console.log(`Error exposing ${appSettings.name} app`, error);
            return Promise.resolve(0);
        }
    }))
    .then(results => {
        const exposedAppsNumber = results.reduce((reduced, result) => reduced + result, 0);
        console.log(`Exposed ${exposedAppsNumber} apps in total!`);
    });
};

const getAppEnvironmentPrefix = (appName: string) => appName.toUpperCase().replace(/-/g,'_') + '__';

export const getAvailableApps = (appsPath: string): AppSettings[] => {
    if (!appsPath) {
        console.error('No apps path was provided');
        return [];
    }

    let appsSettings = getDirectoriesName(appsPath)
        .map(appName => {
            const appPath = join(appsPath, appName);

            let modenaAppConfig: Partial<AppSettings> = {};
            const modenaAppConfigPath = join(appPath, 'modena.json');
            if (existsSync(modenaAppConfigPath)) {
                modenaAppConfig = require(modenaAppConfigPath);
            }

            const appSettings: AppSettings = {
                envVariables: {},
                expressAppFile: join(appPath, modenaAppConfig.expressAppFile || 'get-express-app.js'),
                isDefaultApp: false,
                name: appName,
                path: appPath,
                publicDomains: modenaAppConfig.publicDomains || []
            };
            return appSettings;
        })
        .filter(appSettings => existsSync(appSettings.expressAppFile));

    appsSettings = loadEnvironmentVariables(appsSettings);

    return appsSettings;
};

const getDirectoriesName = (path: string) =>
    readdirSync(path).filter(name => lstatSync(join(path, name)).isDirectory());

export const getRenderIsolator = (appsPath: string) => (req: ModenaRequest, res: Response, next: NextFunction) => {
    if (req.__modenaApp) {
        const renderFunction = res.render.bind(res);
        res.render = (viewName: string, options?: Object) => {
            const viewPath = join(appsPath, req.__modenaApp!.name, 'views', viewName);
            renderFunction(viewPath, options);
        }
    }
    next();
};

const resolveThroughDefaultApp = (appsSettings: AppSettings[]) => {
    const matchingApps = resolveThroughNonUniqueCriteria(appsSettings, appSettings => appSettings.isDefaultApp);
    if (matchingApps.count > 1) {
        console.log(`   Conflict! [${matchingApps.items.map(appSettings => appSettings.name).join(', ')}] apps are all set as default`);
    }

    const accessedApp = matchingApps.items[0];
    if (!accessedApp) {
        console.log(`   No default app was set`);
    }
    else {
        console.log('   Request resolved through default app:', accessedApp.name);
    }

    return accessedApp;
}

const resolveThroughDomain = (appsSettings: AppSettings[], domain: string) => {
    const matchingApps = resolveThroughNonUniqueCriteria(appsSettings, appSettings => Boolean(appSettings.publicDomains.find(d => d === domain)));
    if (matchingApps.count > 1) {
        console.log(`   Conflict! [${matchingApps.items.map(appSettings => appSettings.name).join(', ')}] apps are all matching to ${domain}`);
    }

    const accessedApp = matchingApps.items[0];
    if (!accessedApp) {
        console.log(`   Unable to match the public domain (${domain}) to any app`);
    }
    else {
        console.log('   Request resolved through public domain:', accessedApp.name);
    }

    return accessedApp;
};

const resolveThroughNonUniqueCriteria = (appsSettings: AppSettings[], criteria: (aS: AppSettings) => boolean) => {    
    const matchingAppSettings: MatchingItems<AppSettings> = {
        count: 0,
        items: []
    };
    return appsSettings.reduce((reduced, appSettings) => {
        if (criteria(appSettings)) {
            ++reduced.count;
            reduced.items.push(appSettings);
        }
        return reduced;
    }, matchingAppSettings);
}

const resolveThroughQueryParameters = (appsSettings: AppSettings[], query: Dictionary<string>) => {
    let accessedApp = undefined;
    if (query && query.$modena) {
        accessedApp = appsSettings.find(appSettings => appSettings.name === query.$modena);
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

const resolveThroughUrlPathname = (appsSettings: AppSettings[], url: string) => {
    const accessedApp = appsSettings.find(appSettings => url.startsWith(`/${appSettings.name}`));
    if(!accessedApp) {
        console.log(`   Unable to match the url pathname (${url}) to any app`);
    }
    else {
        console.log('   Request resolved through url pathname:', accessedApp.name);
    }
    return  accessedApp;
}

// TODO Extract the resolvers into resolver.ts

export const getRequestResolver = (appsSettings: AppSettings[]) => (req: ModenaRequest, res: Response, next: NextFunction) => {
    console.log(`Accessing ${req.url}...`);
    req.__modenaApp = undefined;

    req.__modenaApp = resolveThroughDomain(appsSettings, req.headers.host!);    
    // TODO Take into consideration allowCrossAccess for public domains
    req.__modenaApp = req.__modenaApp || resolveThroughQueryParameters(appsSettings, req.query);
    req.__modenaApp = req.__modenaApp || resolveThroughUrlPathname(appsSettings, req.url);
    req.__modenaApp = req.__modenaApp || resolveThroughDefaultApp(appsSettings);

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

const loadEnvironmentVariables = (appsSettings: AppSettings[]) => {
    const appsSettingsDictionary: Dictionary<AppSettings> = appsSettings.reduce((reduced, appSettings) => ({
        ...reduced,
        [getAppEnvironmentPrefix(appSettings.name)]: appSettings
    }), {});
    
    Object.keys(process.env).forEach(envKey => {
        Object.keys(appsSettingsDictionary).forEach(appPrefix => {
            if (envKey.startsWith(appPrefix)) {
                const envVariableName = envKey.replace(appPrefix, '');
                appsSettingsDictionary[appPrefix].envVariables[envVariableName] = process.env[envKey];
                delete process.env[envKey];
            }
        });
    });

    return Object.values(appsSettingsDictionary).reduce((reduced, appSettings) => reduced.concat([appSettings]), [] as AppSettings[]);
};

export const setDefaultApp = (appsSettings: AppSettings[], defaultAppName: string) => {
    const isThereSomeDefaultApp = appsSettings.reduce((reduced, appSettings) => {
        appSettings.isDefaultApp = appSettings.name === defaultAppName;
        return reduced || appSettings.isDefaultApp;
    }, false);

    if(!isThereSomeDefaultApp) {
        console.log(`Error setting the default app: there is no app named ${defaultAppName}`);
    }
};
