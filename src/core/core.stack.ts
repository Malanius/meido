import { EventsBus } from '@/core/event-bus';
import type { AppInfo, DiscordSecret } from '@/types';
import { Aspects, Duration, Stack, type StackProps, Tag } from 'aws-cdk-lib';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';
import { Database } from './database/database';
import { InteractionHandler } from './interaction-handler/interaction-handler';

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
          appId: 'TODO: add app id',
          publicKey: 'TODO: add public key',
          botToken: 'TODO: add bot token',
          guildId: 'TODO: add guild id when using guild commands',
          masterUserId: 'TODO: add master user id',
        } as DiscordSecret),
      },
    });

    const deadLetterQueue = new Queue(this, 'SharedDlq', {
      queueName: `${appName}-${appStage}-dlq`,
      retentionPeriod: Duration.days(14),
    });
    // TODO: add DLQ monitoring

    const eventsBus = new EventsBus(this, 'EventsBus', {
      ...props,
      deadLetterQueue,
    });

    new Database(this, 'Database', {
      ...props,
      eventsBus: eventsBus.eventsBus,
    });

    new InteractionHandler(this, 'InteractionHandler', {
      ...props,
      discordSecrets,
      eventsBus: eventsBus.eventsBus,
    });

    Aspects.of(this).add(new Tag('module', 'core'));
  }
}
