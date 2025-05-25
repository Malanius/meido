import { EventsBus } from '@/core/event-bus';
import type { AppInfo, DiscordSecret } from '@/types';
import { Aspects, CfnOutput, Stack, type StackProps, Tag } from 'aws-cdk-lib';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import { commonFunctionProps } from '../shared/common-funtion-props';
import { powertoolsEnvironment } from '../shared/powertools-config';
import { Database } from './database';
import { InteractionHandler } from './interaction-handler/interaction-handler';
import { InteractionHandlerFunction } from './interaction-handler/interaction-handler-function';

export interface CoreProps extends StackProps, AppInfo {}

export class Core extends Stack {
  constructor(scope: Construct, id: string, props: CoreProps) {
    super(scope, id, props);

    const { appName, appStage } = props;

    new EventsBus(this, 'EventsBus', props);

    const discordSecrets = new Secret(this, 'DiscordSecrets', {
      secretName: `/${appName}/${appStage}/discord`,
      generateSecretString: {
        // This is necessary to create a secret with a custom structure
        generateStringKey: '//',
        secretStringTemplate: JSON.stringify({
          appId: 'TODO: add app id',
          publicKey: 'TODO: add public key',
          botToken: 'TODO: add bot token',
          guildId: 'TODO: add guild id when using guild commands',
        } as DiscordSecret),
      },
    });

    const database = new Database(this, 'Database', props);

    new InteractionHandler(this, 'InteractionHandler', {
      ...props,
      discordSecrets,
      database: database.table,
    });

    Aspects.of(this).add(new Tag('module', 'core'));
  }
}
