import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { ReleaseTrigger } from 'projen/lib/release';

const cdkVersion = '2.221.1';
const powertoolsVersion = '2.28.1';
const sdkVersion = '3.920.0';

const project = new awscdk.AwsCdkTypeScriptApp({
  name: 'meido',
  cdkVersion,
  cdkVersionPinning: true,

  release: true,
  releaseTrigger: ReleaseTrigger.manual(),
  defaultReleaseBranch: 'main',
  github: false,
  packageManager: NodePackageManager.PNPM,

  authorName: 'Michal Slota',
  authorEmail: 'malaniusprivierre@gmail.com',

  scripts: {
    prepare: 'npx lefthook install',
    check: 'npx @biomejs/biome check --write',
    'check:staged': 'npx @biomejs/biome check --write --staged',
  },

  projenrcTs: true,
  tsconfig: {
    compilerOptions: {
      baseUrl: '.',
      paths: {
        '@/*': ['src/*'],
      },
    },
  },

  // Using biome for linting and formatting
  prettier: false,
  eslint: false,
  // TODO: add biome config once projen supports it

  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_22_X,
    awsSdkConnectionReuse: true,
    bundlingOptions: {
      externals: [],
      sourcemap: true,
    },
  },

  deps: [
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

// There is no way to directly register modules in in projen
// So having to use escape hatch to add tsconfig-paths/register
const cdkJson = project.tryFindObjectFile('cdk.json');
cdkJson?.addOverride('app', 'npx ts-node -r tsconfig-paths/register --prefer-ts-exts src/main.ts');

// Not sure why projen is not setting this
const pnpmVersion = '10.18.0';
project.addFields({
  packageManager: `pnpm@${pnpmVersion}`,
  volta: {
    node: '22.20.0',
    pnpm: pnpmVersion,
  },
});

project.synth();
