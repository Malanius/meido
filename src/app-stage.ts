import { Core } from '@/core/core.stack';
import { Ping } from '@/ping/ping.stack';
import { Aspects, Stage, type StageProps, Tag } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

interface AppStageProps extends StageProps {
  appName: string;
}

export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props);
    const { appName } = props;
    const appStage = this.stageName;

    new Core(this, 'core', {
      stackName: `${appName}-${appStage}-core`,
      appName,
      appStage,
    });

    new Ping(this, 'ping', {
      stackName: `${appName}-${appStage}-ping`,
      appName,
      appStage,
    });

    Aspects.of(this).add(new Tag('project', appName));
    Aspects.of(this).add(new Tag('env', appStage));
  }
}
