export { getAvailableApps } from './lib/discovery';
export { getRequestResolver } from './lib/resolvers';
export { exposeHostedApps, getRenderIsolator, launchServer, setDefaultApp } from './lib/misc';
export {
    IMatchingItems,
    IAppSettings,
    IDictionary,
    IModenaOptions,
    IModenaRequest,
} from './lib/types';

// TODO Add winston. Add no-console: true to tslint.json
// TODO Create cucumber unit tests
// TODO Add husky precommit rules (linter, prettier, tests)
