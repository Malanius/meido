import { awscdk } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript/node-package';
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'waifu-bot',
  projenrcTs: true,

  github: false, // Set to true if you want to create a GitHub repository
  github: false,
  packageManager: NodePackageManager.PNPM,

  // deps: [],                /* Runtime dependencies of this module. */
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();