import { Application, NextFunction, Request, Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import * as https from 'https';
import { IHttpsConfiguration, IServerConfiguration } from './types';

const createHttpsServer = (
    app: Application,
    httpsConfiguration: IHttpsConfiguration,
    resolve: () => void
) => {
    const httpsCredentials = {
        cert: readFileSync(httpsConfiguration.certPath),
        key: readFileSync(httpsConfiguration.keyPath),
        passphrase: httpsConfiguration.passphrase
    };
    https.createServer(httpsCredentials, app).listen(httpsConfiguration.port, () => {
        console.log(`HTTPS express app listening at port ${httpsConfiguration.port}`);
        resolve();
    });
};

const getHttpsConfiguration = (configuration?: IHttpsConfiguration) => {
    let httpsConfiguration: IHttpsConfiguration | undefined;
    if (configuration) {
        httpsConfiguration = {
            disableHttp: false,
            enableHttps: true,
            port: 443,
            ...configuration
        };
    }
    return httpsConfiguration;
};

export const httpsRedirectMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if (req.secure) {
        next();
    } else {
        // We need to get rid of the port number in order to redirect to HTTPS
        const hostname = req.headers.host!.split(':')[0];
        res.redirect(`https://${hostname}${req.url}`);
    }
};

const isHttpsConfigurationValid = (httpsConfiguration: IHttpsConfiguration) => {
    const existsCert = existsSync(httpsConfiguration.certPath);
    if (!existsCert) {
        console.error('Wrong HTTPS configuration! Unable to find the provided certPath');
    }

    const existsKey = existsSync(httpsConfiguration.keyPath);
    if (!existsKey) {
        console.error('Wrong HTTPS configuration! Unable to find the provided keyPath');
    }

    if (!httpsConfiguration.enableHttps) {
        console.log('Not launching HTTPS express app (enabledHttps is set to false)');
    }

    return existsCert && existsKey && httpsConfiguration.enableHttps;
};

const launchHttpServer = (app: Application, port: number) => {
    return new Promise((resolve: (result?: any) => void, reject: (error?: any) => void) => {
        app.listen(port, (error: any) => {
            if (error) {
                reject(error);
            } else {
                console.log(`HTTP express app listening at port ${port}`);
                resolve();
            }
        });
    });
};

const launchHttpsServer = (
    app: Application,
    port: number,
    httpsConfiguration: IHttpsConfiguration
) => {
    return new Promise((resolve: (result?: any) => void, reject: (error?: any) => void) => {
        if (!httpsConfiguration.disableHttp) {
            launchHttpServer(app, port)
                .then(_ => createHttpsServer(app, httpsConfiguration, resolve))
                .catch(reject);
        } else {
            console.log('Not launching HTTP express app (disableHttp is set to true)');
            createHttpsServer(app, httpsConfiguration, resolve);
        }
    });
};

export const launchServer = (
    app: Application,
    configuration: Partial<IServerConfiguration> = {}
) => {
    const serverConfiguration: IServerConfiguration = {
        httpsConfiguration: undefined,
        port: 80,
        ...configuration
    };
    const httpsConfiguration = getHttpsConfiguration(serverConfiguration.httpsConfiguration);
    return httpsConfiguration && isHttpsConfigurationValid(httpsConfiguration)
        ? launchHttpsServer(app, serverConfiguration.port, httpsConfiguration)
        : launchHttpServer(app, serverConfiguration.port);
};
