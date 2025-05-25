import { env } from 'node:process';
import { App, Aspects, Tag } from 'aws-cdk-lib';
import { AppStage } from './app-stage';

const appName = 'waifu-bot';
const appEnv = env.APP_ENV || 'dev';
const app = new App();

new AppStage(app, appEnv, { appName });

app.synth();
