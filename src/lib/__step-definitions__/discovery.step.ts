import { expect } from 'chai';
import { Given, Then, When } from 'cucumber';
import { getAppEnvironmentPrefix } from '../discovery';

let appName: string;
let appPrefix: string;

Given('An app named {string}', (_appName: string) => {
    appName = _appName;
});

When('I get the app environment prefix for the given app', () => {
    appPrefix = getAppEnvironmentPrefix(appName);
});

Then('I should get the value {string}', (value: string) => {
    expect(value).to.be.equal(appPrefix);
});
