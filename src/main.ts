import { env } from 'node:process';
import { App } from 'aws-cdk-lib';
import { AppStage } from './app-stage';

const appName = 'meido';
const appEnv = env.APP_ENV || 'dev';
const app = new App();

new AppStage(app, appEnv, { appName });

app.synth();
