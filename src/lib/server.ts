import { Application, NextFunction, Request, Response } from 'express';
import { existsSync, readFileSync } from 'fs';
import * as https from 'https';
import { IHttpsConfiguration, IServerConfiguration } from './types';

const createHttpsServer = (app: Application, options: IHttpsConfiguration, resolve: () => void) => {
    const httpsCredentials = {
        cert: readFileSync(options.certPath),
        key: readFileSync(options.keyPath),
        passphrase: options.passphrase
    };
    https.createServer(httpsCredentials, app).listen(443, () => {
        console.log(`HTTPS express app listening at port 443`);
        resolve();
    });
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

const isHttpsConfigurationValid = (options?: IHttpsConfiguration) => {
    let isValid = false;
    if (options && (options.enableHttps === undefined || options.enableHttps)) {
        const existsCert = existsSync(options.certPath);
        if (!existsCert) {
            console.error('Wrong HTTPS configuration! Unable to find the provided certPath');
        }

        const existsKey = existsSync(options.keyPath);
        if (!existsKey) {
            console.error('Wrong HTTPS configuration! Unable to find the provided keyPath');
        }

        isValid = existsCert && existsKey;
    }
    return isValid;
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

const launchHttpsServer = (app: Application, port: number, options: IHttpsConfiguration) => {
    return new Promise((resolve: (result?: any) => void, reject: (error?: any) => void) => {
        console.log(options);
        if (options.disableHttp === undefined || !options.disableHttp) {
            launchHttpServer(app, port)
                .then(_ => createHttpsServer(app, options, resolve))
                .catch(reject);
        } else {
            console.log('Not launching HTTP express app');
            createHttpsServer(app, options, resolve);
        }
    });
};

export const launchServer = (app: Application, options: Partial<IServerConfiguration> = {}) => {
    const defaultedOptions: IServerConfiguration = {
        httpsConfiguration: undefined,
        port: 80,
        ...options
    };
    return isHttpsConfigurationValid(defaultedOptions.httpsConfiguration)
        ? launchHttpsServer(app, defaultedOptions.port, defaultedOptions.httpsConfiguration!)
        : launchHttpServer(app, defaultedOptions.port);
};
