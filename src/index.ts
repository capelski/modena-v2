export { exposeHostedApps } from './lib/expose';
export { httpsRedirectMiddleware, launchServer } from './lib/server';
export {
    IAppSettings,
    IDiscoveryConfiguration,
    IHttpsConfiguration,
    IServerConfiguration
} from './lib/types';

// TODO LICENSE.md
// TODO Test loadEnvironmentVariables and exposeHostedApps
// TODO Add winston. Add no-console: true to tslint.json. Add configuration parameters for the LOGS filename and Console Output
