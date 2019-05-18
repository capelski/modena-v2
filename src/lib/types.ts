import { Request } from 'express';

export interface AppSettings {
    envVariables: Dictionary<string | undefined>;
    expressAppFile: string;
    isDefaultApp: boolean;
    name: string;
    path: string;
    publicDomains: string[];
}

export interface Dictionary<T> {
    [key: string]: T;
}

export interface MatchingItems<T> {
    count: number;
    items: T[];
}

export interface ModenaRequest extends Request {
    __modenaApp?: AppSettings;
}