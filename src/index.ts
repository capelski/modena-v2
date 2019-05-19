export { getAvailableApps } from './lib/discovery';
export { exposeHostedApps, getRenderIsolator, setDefaultApp } from './lib/misc';
export { getRequestResolver } from './lib/resolvers';
export { httpsRedirectMiddleware, launchServer } from './lib/server';
export {
    IAppSettings,
    IDictionary,
    IHttpsConfiguration,
    IMatchingItems,
    IModenaOptions,
    IModenaRequest,
} from './lib/types';

// TODO .prettier trailing comma to none
// TODO README.md, LICENSE.md
// TODO Add winston. Add no-console: true to tslint.json
// TODO Create cucumber unit tests
// TODO Add tests to husky pre-commit hook
