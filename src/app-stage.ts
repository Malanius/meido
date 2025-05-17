import { Stage, type StageProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

interface AppStageProps extends StageProps {
  appName: string;
}

export class AppStage extends Stage {
  constructor(scope: Construct, id: string, props: AppStageProps) {
    super(scope, id, props);
    const { appName } = props;
    const appStage = this.stageName;
  }
}
