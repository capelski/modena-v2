import { Request, Response } from 'express';

export interface IAppSettings {
    envVariables: IDictionary<string | undefined>;
    expressAppFile: string;
    isDefaultApp: boolean;
    name: string;
    path: string;
    publicDomainCrossAccess: boolean;
    publicDomains: string[];
}

export interface IDictionary<T> {
    [key: string]: T;
}

export interface IDiscoveryConfiguration {
    appsPath?: string;
    defaultApp?: string;
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

export interface IModenaRequest extends Request {
    __modenaApp?: IAppSettings;
    __originalUrl?: string;
}

export interface IModenaResponse extends Response {
    __originalRender?: (viewPath: string, options?: object) => void;
}

export interface IServerConfiguration {
    httpsConfiguration?: IHttpsConfiguration;
    port: number;
}
