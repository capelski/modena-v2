import { NextFunction, Response } from 'express';
import { IAppSettings, IDictionary, IMatchingItems, IModenaRequest } from './types';

const resolveThroughDefaultApp = (appsSettings: IAppSettings[]) => {
    const matchingApps = resolveThroughNonUniqueCriteria(
        appsSettings,
        appSettings => appSettings.isDefaultApp
    );
    if (matchingApps.count > 1) {
        console.log(
            `   Conflict! [${matchingApps.items
                .map(appSettings => appSettings.name)
                .join(', ')}] apps are all set as default`
        );
    }

    const accessedApp = matchingApps.items[0];
    if (!accessedApp) {
        console.log(`   No default app was set`);
    } else {
        console.log('   Request resolved through default app:', accessedApp.name);
    }

    return accessedApp;
};

const resolveThroughDomain = (appsSettings: IAppSettings[], domain: string) => {
    const matchingApps = resolveThroughNonUniqueCriteria(appsSettings, appSettings =>
        Boolean(appSettings.publicDomains.find(d => d === domain))
    );
    if (matchingApps.count > 1) {
        console.log(
            `   Conflict! [${matchingApps.items
                .map(appSettings => appSettings.name)
                .join(', ')}] apps are all matching to ${domain}`
        );
    }

    const accessedApp = matchingApps.items[0];
    if (!accessedApp) {
        console.log(`   Unable to match the public domain (${domain}) to any app`);
    } else {
        console.log('   Request resolved through public domain:', accessedApp.name);
    }

    return accessedApp;
};

const resolveThroughNonUniqueCriteria = (
    appsSettings: IAppSettings[],
    criteria: (aS: IAppSettings) => boolean
) => {
    const matchingAppSettings: IMatchingItems<IAppSettings> = {
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
};

const resolveThroughQueryParameters = (
    appsSettings: IAppSettings[],
    query: IDictionary<string>
) => {
    let accessedApp: IAppSettings | undefined;
    if (query && query.$modena) {
        accessedApp = appsSettings.find(appSettings => appSettings.name === query.$modena);
        if (!accessedApp) {
            console.log(
                `   Unable to match the $modena query parameter (${query.$modena}) to any app`
            );
        } else {
            console.log('   Request resolved through $modena query parameter:', accessedApp.name);
        }
    } else {
        console.log('   No $modena query parameter was provided');
    }
    return accessedApp;
};

const resolveThroughUrlPathname = (appsSettings: IAppSettings[], url: string) => {
    const accessedApp = appsSettings.find(appSettings => url.startsWith(`/${appSettings.name}`));
    if (!accessedApp) {
        console.log(`   Unable to match the url pathname (${url}) to any app`);
    } else {
        console.log('   Request resolved through url pathname:', accessedApp.name);
    }
    return accessedApp;
};

export const getRequestResolver = (appsSettings: IAppSettings[]) => (
    req: IModenaRequest,
    res: Response,
    next: NextFunction
) => {
    console.log(`Accessing ${req.url}...`);

    req.__modenaApp = resolveThroughDomain(appsSettings, req.headers.host!);
    const isPublicDomainCrossAccess = req.__modenaApp && req.__modenaApp.publicDomainCrossAccess;

    if (!req.__modenaApp || isPublicDomainCrossAccess) {
        const queryParameterApp = resolveThroughQueryParameters(appsSettings, req.query);
        if (queryParameterApp) {
            req.__modenaApp = queryParameterApp;
        } else {
            const urlPathnameApp = resolveThroughUrlPathname(appsSettings, req.url);
            if (urlPathnameApp) {
                req.__modenaApp = urlPathnameApp;
            } else if (!isPublicDomainCrossAccess) {
                req.__modenaApp = resolveThroughDefaultApp(appsSettings);
            }
        }
    }

    if (req.__modenaApp) {
        const namespacePrefix = '/' + req.__modenaApp.name;
        if (!req.url.startsWith(namespacePrefix)) {
            req.url = namespacePrefix + req.url;
            console.log(`   Request url updated: ${req.url}`);
        }
    } else {
        console.log('   The request could not be resolved to any app');
    }

    next();
};
