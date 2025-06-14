import { Core } from '@/core/core.stack';
import { Tadaima } from '@/tadaima/tadaima.stack';
import { Aspects, Stage, type StageProps, Tag } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { GitHubDeploy } from './deploy/github-deploy.stack';
import { Journal } from './journal/journal.stack';

interface AppStageProps extends StageProps {
  appName: string;
}

export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props);
    const { appName } = props;
    const appStage = this.stageName;

    if (appStage === 'prod') {
      new GitHubDeploy(this, 'gh-deploy', {
        stackName: `${appName}-${appStage}-gh-deploy`,
        repository: 'Malanius/meido',
      });
    }

    const core = new Core(this, 'core', {
      stackName: `${appName}-${appStage}-core`,
      appName,
      appStage,
    });

    const journal = new Journal(this, 'journal', {
      stackName: `${appName}-${appStage}-journal`,
      appName,
      appStage,
    });
    journal.addDependency(core);

    const tadaima = new Tadaima(this, 'tadaima', {
      stackName: `${appName}-${appStage}-tadaima`,
      appName,
      appStage,
    });
    tadaima.addDependency(core);

    Aspects.of(this).add(new Tag('project', appName));
    Aspects.of(this).add(new Tag('env', appStage));
  }
}
