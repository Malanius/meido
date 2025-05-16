import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
import { ReleaseTrigger } from 'projen/lib/release';

const cdkVersion = '2.196.0';

const project = new awscdk.AwsCdkTypeScriptApp({
  name: 'waifu-bot',
  cdkVersion,
  cdkVersionPinning: true,
  projenrcTs: true,

  release: true,
  releaseTrigger: ReleaseTrigger.manual(),
  defaultReleaseBranch: 'main',
  github: false,
  packageManager: NodePackageManager.PNPM,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();
