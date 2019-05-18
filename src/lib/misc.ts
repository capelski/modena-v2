import { Application, Response, NextFunction } from 'express';
import { join } from 'path';
import { AppSettings, ModenaRequest } from './types';

export const exposeHostedApps = (mainApp: Application, appsSettings: AppSettings[]) => {
    return Promise.all(
        appsSettings.map(appSettings => {
            try {
                const getExpressHostedApp = require(appSettings.expressAppFile);
                const expressHostedApp = getExpressHostedApp(appSettings.envVariables);
                if (!(expressHostedApp instanceof Promise)) {
                    mainApp.use(`/${appSettings.name}`, expressHostedApp);
                    console.log(`Successfully exposed ${appSettings.name}`);
                    return Promise.resolve(1);
                } else {
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
            } catch (error) {
                console.log(`Error exposing ${appSettings.name} app`, error);
                return Promise.resolve(0);
            }
        })
    ).then(results => {
        const exposedAppsNumber = results.reduce((reduced, result) => reduced + result, 0);
        console.log(`Exposed ${exposedAppsNumber} apps in total!`);
    });
};

export const getRenderIsolator = (appsPath: string) => (
    req: ModenaRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.__modenaApp) {
        const renderFunction = res.render.bind(res);
        res.render = (viewName: string, options?: Object) => {
            const viewPath = join(appsPath, req.__modenaApp!.name, 'views', viewName);
            renderFunction(viewPath, options);
        };
    }
    next();
};

export const setDefaultApp = (appsSettings: AppSettings[], defaultAppName: string) => {
    const isThereSomeDefaultApp = appsSettings.reduce((reduced, appSettings) => {
        appSettings.isDefaultApp = appSettings.name === defaultAppName;
        return reduced || appSettings.isDefaultApp;
    }, false);

    if (!isThereSomeDefaultApp) {
        console.log(`Error setting the default app: there is no app named ${defaultAppName}`);
    }
};
