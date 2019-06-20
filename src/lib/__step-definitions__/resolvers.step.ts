import { expect } from 'chai';
import { Given, Then, When } from 'cucumber';
import { join } from 'path';
import { resolveRequest } from '../resolvers';
import { IAppSettings, IDictionary, IModenaRequest } from '../types';

let appsSettings: IAppSettings[];
let request: IModenaRequest;

const evaluateResolveRequest = (domain = 'localhost', urlPathname = '', queryString = '') => {
    const queryParts = queryString.split('&');
    const query = queryParts.reduce(
        (reduced, next) => {
            const [key, ...values] = next.split('=');
            return {
                ...reduced,
                [key]: values.join('')
            };
        },
        // tslint:disable-next-line:no-object-literal-type-assertion
        {} as IDictionary<string>
    );
    request = {
        headers: {
            host: domain
        },
        query,
        url: urlPathname
    } as any;
    resolveRequest(request, appsSettings);
};

Given(
    /the app settings contained in the file "([^.]+\.[^.]+)" \(inside the apps folder\)/,
    (appSettingsJsonFilename: string) => {
        const settingsFile = join(
            __dirname,
            '..',
            '..',
            '..',
            'features',
            'apps-settings',
            appSettingsJsonFilename
        );
        const _appsSettings = require(settingsFile) as IAppSettings[];
        appsSettings = _appsSettings.map((appSettings, index) => ({
            envVariables: {},
            expressAppFile: '',
            isDefaultApp: appSettings.isDefaultApp || false,
            name: appSettings.name || `app-${index + 1}`,
            path: '',
            publicDomainCrossAccess: appSettings.publicDomainCrossAccess || false,
            publicDomains: appSettings.publicDomains || []
        }));
    }
);

When('the request with {string} pathname is resolved', (urlPathname: string) => {
    evaluateResolveRequest(undefined, urlPathname);
});

When(
    'the request with {string} domain and {string} pathname is resolved',
    (domain: string, urlPathname: string) => {
        evaluateResolveRequest(domain, urlPathname);
    }
);

When(
    'the request with {string} pathname and {string} query parameters is resolved',
    (urlPathname: string, queryString: string) => {
        evaluateResolveRequest(undefined, urlPathname, queryString);
    }
);

When(
    'the request with {string} domain, {string} pathname and {string} query parameters is resolved',
    (domain: string, urlPathname: string, queryString: string) => {
        evaluateResolveRequest(domain, urlPathname, queryString);
    }
);

Then('no app is matched', () => {
    expect(request.__modenaApp).to.be.equal(undefined);
});

Then('the {string} app is matched', (appName: string) => {
    expect(request.__modenaApp && request.__modenaApp.name).to.be.equal(appName);
});

Then('the request pathname is {string}', (urlPathname: string) => {
    expect(request.url).to.be.equal(urlPathname);
});
