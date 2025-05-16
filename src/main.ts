import { App, Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    // define resources here...
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'waifu-bot-dev', { env: devEnv });
// new MyStack(app, 'waifu-bot-prod', { env: prodEnv });

app.synth();
