import { commonFunctionProps } from '@/shared/common-funtion-props';
import { powertoolsEnvironment } from '@/shared/powertools-config';
import type { AppInfo } from '@/types';
import { CfnOutput } from 'aws-cdk-lib';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { InteractionHandlerFunction } from './interaction-handler-function';

export interface InteractionHandlerProps extends AppInfo {
  discordSecrets: ISecret;
}

export class InteractionHandler extends Construct {
  constructor(scope: Construct, id: string, props: InteractionHandlerProps) {
    super(scope, id);

    const { discordSecrets } = props;

    const interactionHandler = new InteractionHandlerFunction(
      this,
      'InteractionHandler',
      {
        ...commonFunctionProps,
        environment: {
          ...powertoolsEnvironment(props, 'core'),
          DISCORD_SECRET_NAME: discordSecrets.secretName,
        },
      }
    );

    const url = interactionHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    discordSecrets.grantRead(interactionHandler);

    new CfnOutput(this, 'FunctionUrl', {
      description: 'The URL of the interaction handler function',
      value: url.url,
    });
  }
}
