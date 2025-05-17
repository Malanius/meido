import type { AppInfo, DiscordSecret } from '@/types';
import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import { commonFunctionProps } from './common/common-funtion-props';
import { powertoolsEnvironment } from './common/powertools-config';
import { InteractionHandlerFunction } from './interaction-handler/interaction-handler-function';

export interface CoreProps extends StackProps, AppInfo {}

export class Core extends Stack {
  constructor(scope: Construct, id: string, props: CoreProps) {
    super(scope, id, props);

    const { appName, appStage } = props;

    const discordSecrets = new Secret(this, 'DiscordSecrets', {
      secretName: `/${appName}/${appStage}/discord`,
      generateSecretString: {
        // This is necessary to create a secret with a custom structure
        generateStringKey: '//',
        secretStringTemplate: JSON.stringify({
          publicKey: 'TODO: add public key',
        } as DiscordSecret),
      },
    });

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
