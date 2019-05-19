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

// TODO README.md, LICENSE.md
// TODO Enable HTTPs capabilities
// TODO Add winston. Add no-console: true to tslint.json
// TODO Create cucumber unit tests
// TODO Add tests to husky pre-commit hook
