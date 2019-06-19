export { exposeHostedApps } from './lib/expose';
export { httpsRedirectMiddleware, launchServer } from './lib/server';
export {
    IAppSettings,
    IDiscoveryConfiguration,
    IHttpsConfiguration,
    IServerConfiguration
} from './lib/types';

// TODO README.md, LICENSE.md
// TODO Add winston. Add no-console: true to tslint.json. Add configuration parameters for the LOGS filename and Console Output
// TODO Create cucumber unit tests
// TODO Add tests to husky pre-commit hook
