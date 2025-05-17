import type { AppInfo, DiscordSecret } from '@/types';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';

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
  }
}
