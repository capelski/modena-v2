import { Application, NextFunction } from 'express';
import { join } from 'path';
import { getAvailableApps } from './discovery';
import { getRequestResolverMiddleware } from './resolvers';
import { IAppSettings, IModenaConfiguration, IModenaRequest, IModenaResponse } from './types';

export const exposeHostedApps = (mainApp: Application, configuration: IModenaConfiguration) => {
    const appsPath = configuration.appsPath || join(__dirname, '..', '..', '..', '..', 'apps');
    const appsSettings = getAvailableApps(appsPath);

    if (configuration.defaultApp) {
        setDefaultApp(appsSettings, configuration.defaultApp);
    }

    mainApp.use(getRequestResolverMiddleware(appsSettings));
    mainApp.use(getRenderIsolatorMiddleware(appsPath));

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
                    console.log(`Exposing ${appSettings.name} asynchronously...`);
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
        mainApp.use((req: IModenaRequest, res: IModenaResponse, next: NextFunction) => {
            console.log(
                `   Unable to find the requested resource (${req.url}) in the ${
                    req.__modenaApp!.name
                } app. Restoring the original request...`
            );
            restoreRequest(req, res);
            next();
        });
        mainApp.use((error: any, req: IModenaRequest, res: IModenaResponse, next: NextFunction) => {
            console.log(
                `   An error ocurred serving the requested resource (${req.url}) in the ${
                    req.__modenaApp!.name
                } app. Restoring the original request...`
            );
            restoreRequest(req, res);
            next(error);
        });

        const exposedAppsNumber = results.reduce((reduced, result) => reduced + result, 0);
        console.log(`Exposed ${exposedAppsNumber} apps in total!`);

        return appsSettings;
    });
};

const getRenderIsolatorMiddleware = (appsPath: string) => (
    req: IModenaRequest,
    res: IModenaResponse,
    next: NextFunction
) => {
    if (req.__modenaApp) {
        res.__originalRender = res.render;
        res.render = (viewName: string, options?: object) => {
            const viewPath = join(appsPath, req.__modenaApp!.name, 'views', viewName);
            res.__originalRender!(viewPath, options);
        };
    }
    next();
};

const restoreRequest = (req: IModenaRequest, res: IModenaResponse) => {
    if (req.__modenaApp) {
        req.url = req.__originalUrl!;
        delete req.__originalUrl;
        delete req.__modenaApp;

        res.render = res.__originalRender!;
        delete res.__originalRender;
    }
};

const setDefaultApp = (appsSettings: IAppSettings[], defaultAppName: string) => {
    const isThereSomeDefaultApp = appsSettings.reduce((reduced, appSettings) => {
        appSettings.isDefaultApp = appSettings.name === defaultAppName;
        return reduced || appSettings.isDefaultApp;
    }, false);

    if (!isThereSomeDefaultApp) {
        console.log(`Error setting the default app: there is no app named ${defaultAppName}`);
    }
};
