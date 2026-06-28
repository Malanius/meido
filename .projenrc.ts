import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { ReleaseTrigger } from 'projen/lib/release';
import { biomeOptions } from './.projenrc.biome';

const cdkVersion = '2.260.0';
const powertoolsVersion = '2.31.0';
const sdkVersion = '3.1009.0';

const project = new awscdk.AwsCdkTypeScriptApp({
  name: 'meido',
  cdkVersion,
  cdkVersionPinning: true,

  release: true,
  releaseTrigger: ReleaseTrigger.manual(),
  defaultReleaseBranch: 'main',
  github: false,
  packageManager: NodePackageManager.BUN,

  authorName: 'Michal Slota',
  authorEmail: 'malaniusprivierre@gmail.com',

  projenrcTs: true,
  tsconfig: {
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['src/*'],
      },
    },
  },

  biome: true,
  biomeOptions,

  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_24_X,
    awsSdkConnectionReuse: true,
    bundlingOptions: {
      externals: [],
      sourcemap: true,
    },
  },

  deps: [
    `@aws-cdk/aws-pipes-alpha@${cdkVersion}-alpha.0`,
    `@aws-cdk/aws-pipes-sources-alpha@${cdkVersion}-alpha.0`,
    `@aws-cdk/aws-pipes-targets-alpha@${cdkVersion}-alpha.0`,
    `@aws-lambda-powertools/batch@${powertoolsVersion}`,
    `@aws-lambda-powertools/logger@${powertoolsVersion}`,
    `@aws-lambda-powertools/parameters@${powertoolsVersion}`,
    `@aws-lambda-powertools/parser@${powertoolsVersion}`,
    `@aws-lambda-powertools/tracer@${powertoolsVersion}`,
    `@aws-lambda-powertools/validation@${powertoolsVersion}`,
    `@aws-sdk/client-dynamodb@${sdkVersion}`,
    `@aws-sdk/client-eventbridge@${sdkVersion}`,
    `@aws-sdk/client-secrets-manager@${sdkVersion}`,
    `@aws-sdk/lib-dynamodb@${sdkVersion}`,
    '@middy/core',
    'axios',
    'axios-retry',
    'tweetnacl',
    'zod@~4',
  ],
  devDeps: [
    '@types/aws-lambda',
    '@biomejs/biome@^2',
    '@commitlint/config-conventional',
    'commitlint',
    'cz-conventional-changelog',
    'discord-api-types',
    'lefthook',
    'ts-node',
    'tsconfig-paths',
  ],
});

project.addTask('prepare', {
  description: 'Prepare the project for development',
  exec: 'bunx lefthook install',
});

project.addTask('check', {
  description: 'Check the code style and formatting',
  exec: 'bunx biome check --write',
});

project.addTask('check:staged', {
  description: 'Check the code style and formatting for staged files',
  exec: 'bunx biome check --write --staged',
});

project.synth();
