import { awscdk } from 'projen';
import { type AddBundleOptions, TypeScriptModuleResolution } from 'projen/lib/javascript';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { ReleaseTrigger } from 'projen/lib/release';

import { biomeOptions } from './projenrc/biome';
import { context } from './projenrc/cdk';

const cdkVersion = '2.275.0';
const powertoolsVersion = '2.36.0';
const sdkVersion = '3.1158.0';

const lambdaBundling = {
  externals: [],
  sourcemap: true,
  mainFields: ['module', 'main'],
  minify: true,
  format: 'esm',
  outfile: 'index.mjs',
  banner: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
} satisfies Partial<AddBundleOptions>;

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
      target: 'esnext',
      module: 'esnext',
      moduleResolution: TypeScriptModuleResolution.BUNDLER,
      lib: ['esnext'],
      types: ['aws-lambda', 'bun-types', 'node'],
      typeRoots: ['./node_modules/@types', './node_modules'],
      emitDecoratorMetadata: true,
      forceConsistentCasingInFileNames: true,
      skipLibCheck: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
  },

  // No need for this with bun tests
  jest: false,

  biome: true,
  biomeOptions,

  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_24_X,
    awsSdkConnectionReuse: false, // not needed for SDK v3
    bundlingOptions: lambdaBundling,
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
    '@middy/core@7.9.2',
    'axios',
    'axios-retry',
    'tweetnacl',
    'zod@~4',
  ],
  devDeps: [
    '@types/node@^24',
    '@types/aws-lambda',
    '@biomejs/biome@^2',
    '@commitlint/config-conventional',
    'bun-types@^1.4.4',
    'commitlint',
    'cz-conventional-changelog',
    'discord-api-types',
    'lefthook',
    'ts-node',
    'tsconfig-paths',
  ],
  context,
});

project.defaultTask?.reset('bun .projenrc.ts');
project.compileTask.exec('bun run tsc --project tsconfig.json --noEmit');
project.cdkConfig.json.addOverride('build', 'bunx projen compile && bunx projen bundle');

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
