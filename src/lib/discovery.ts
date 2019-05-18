import { existsSync, lstatSync, readdirSync } from 'fs';
import { join } from 'path';
import { AppSettings, Dictionary } from './types';

const getAppEnvironmentPrefix = (appName: string) =>
    appName.toUpperCase().replace(/-/g, '_') + '__';

export const getAvailableApps = (appsPath: string): AppSettings[] => {
    if (!appsPath) {
        console.error('No apps path was provided');
        return [];
    }

    let appsSettings = getDirectoriesName(appsPath)
        .map(appName => {
            const appPath = join(appsPath, appName);

            let modenaAppConfig: Partial<AppSettings> = {};
            const modenaAppConfigPath = join(appPath, 'modena.json');
            if (existsSync(modenaAppConfigPath)) {
                modenaAppConfig = require(modenaAppConfigPath);
            }

            const appSettings: AppSettings = {
                envVariables: {},
                expressAppFile: join(
                    appPath,
                    modenaAppConfig.expressAppFile || 'get-express-app.js'
                ),
                isDefaultApp: false,
                name: appName,
                path: appPath,
                publicDomains: modenaAppConfig.publicDomains || [],
            };
            return appSettings;
        })
        .filter(appSettings => existsSync(appSettings.expressAppFile));

    appsSettings = loadEnvironmentVariables(appsSettings);

    return appsSettings;
};

const getDirectoriesName = (path: string) =>
    readdirSync(path).filter(name => lstatSync(join(path, name)).isDirectory());

const loadEnvironmentVariables = (appsSettings: AppSettings[]) => {
    const appsSettingsDictionary: Dictionary<AppSettings> = appsSettings.reduce(
        (reduced, appSettings) => ({
            ...reduced,
            [getAppEnvironmentPrefix(appSettings.name)]: appSettings,
        }),
        {}
    );

    Object.keys(process.env).forEach(envKey => {
        Object.keys(appsSettingsDictionary).forEach(appPrefix => {
            if (envKey.startsWith(appPrefix)) {
                const envVariableName = envKey.replace(appPrefix, '');
                appsSettingsDictionary[appPrefix].envVariables[envVariableName] =
                    process.env[envKey];
                delete process.env[envKey];
            }
        });
    });

    return Object.values(appsSettingsDictionary).reduce(
        (reduced, appSettings) => reduced.concat([appSettings]),
        [] as AppSettings[]
    );
};
