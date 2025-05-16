import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { ReleaseTrigger } from 'projen/lib/release';

const cdkVersion = '2.196.0';

const project = new awscdk.AwsCdkTypeScriptApp({
  name: 'waifu-bot',
  cdkVersion,
  cdkVersionPinning: true,

  release: true,
  releaseTrigger: ReleaseTrigger.manual(),
  defaultReleaseBranch: 'main',
  github: false,
  packageManager: NodePackageManager.PNPM,

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

  deps: [],
  devDeps: [
    '@biomejs/biome@1.9.4',
    '@commitlint/config-conventional',
    'commitlint',
    'cz-conventional-changelog',
    'lefthook',
    'ts-node',
    'tsconfig-paths',
  ],
});

// There is no way to directly register modules in in projen
// So having to use escape hatch to add tsconfig-paths/register
const cdkJson = project.tryFindObjectFile('cdk.json');
cdkJson?.addOverride(
  'app',
  'npx ts-node -r tsconfig-paths/register --prefer-ts-exts src/main.ts'
);

project.synth();
