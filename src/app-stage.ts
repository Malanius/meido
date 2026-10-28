import { Aspects, Stage, type StageProps, Tag } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

import type { AppInfo } from '@/common/app-info';
import { Core } from '@/core/core.stack';
import { Tadaima } from '@/tadaima/tadaima.stack';

import { GitHubDeploy } from './deploy/github-deploy.stack';
import { Journal } from './journal/journal.stack';

interface AppStageProps extends StageProps, AppInfo {}

export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props);
    const { appName, appEnv } = props;

    if (appEnv === 'prod') {
      new GitHubDeploy(this, 'gh-deploy', {
        stackName: `${appName}-${appEnv}-gh-deploy`,
        repository: 'Malanius/meido',
      });
    }

    const core = new Core(this, 'core', {
      stackName: `${appName}-${appEnv}-core`,
      appName,
      appEnv,
    });

    const journal = new Journal(this, 'journal', {
      stackName: `${appName}-${appEnv}-journal`,
      appName,
      appEnv,
    });
    journal.addDependency(core);

    const tadaima = new Tadaima(this, 'tadaima', {
      stackName: `${appName}-${appEnv}-tadaima`,
      appName,
      appEnv,
    });
    tadaima.addDependency(core);

    Aspects.of(this).add(new Tag('project', appName));
    Aspects.of(this).add(new Tag('env', appEnv));
  }
}
