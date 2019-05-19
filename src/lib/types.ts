import { Request } from 'express';

export interface IAppSettings {
    envVariables: IDictionary<string | undefined>;
    expressAppFile: string;
    isDefaultApp: boolean;
    name: string;
    path: string;
    publicDomains: string[];
}

export interface IDictionary<T> {
    [key: string]: T;
}

export interface IMatchingItems<T> {
    count: number;
    items: T[];
}

export interface IHttpsConfiguration {
    certPath: string;
    disableHttp?: boolean;
    enableHttps?: boolean;
    keyPath: string;
    passphrase?: string;
}

export interface IModenaOptions {
    httpsConfiguration?: IHttpsConfiguration;
    port: number;
}

export interface IModenaRequest extends Request {
    __modenaApp?: IAppSettings;
}
