import { Duration } from 'aws-cdk-lib';
import type { ITableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { type IEventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { IQueue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { EventsSource } from '@/shared/event-source';
import { commonFunctionEnvironment, commonFunctionProps } from '@/shared/functions';
import type { AppInfo } from '@/types';
import { BrodcastHandlerFunction } from './brodcast-handler-function';

const MODULE = 'journal';

export interface BroadcasterProps extends AppInfo {
  eventBus: IEventBus;
  database: ITableV2;
  deadLetterQueue: IQueue;
}

export class Broadcaster extends Construct {
  constructor(scope: Construct, id: string, props: BroadcasterProps) {
    super(scope, id);

    const { appName, appStage, eventBus, database, deadLetterQueue } = props;

    const discordSecrets = Secret.fromSecretNameV2(this, 'DiscordSecret', `/${appName}/${appStage}/discord`);

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/${appName}/${appStage}/${MODULE}/broadcaster`,
    });

    const brodcastHandler = new BrodcastHandlerFunction(this, 'BrodcastHandler', {
      ...commonFunctionProps,
      environment: {
        ...commonFunctionEnvironment(props, MODULE),
        DATABASE_TABLE_NAME: database.tableName,
        DISCORD_SECRET_NAME: discordSecrets.secretName,
      },
      logGroup,
    });

    database.grantReadData(brodcastHandler);
    discordSecrets.grantRead(brodcastHandler);

    new Rule(this, 'BrodcastRule', {
      eventBus,
      eventPattern: {
        source: [EventsSource.Database],
        detail: {
          eventName: ['INSERT'],
        },
      },
      targets: [
        new LambdaFunction(brodcastHandler, {
          maxEventAge: Duration.minutes(1),
          retryAttempts: 2,
          deadLetterQueue,
        }),
      ],
      description: `/${MODULE}/broadcaster`,
    });
  }
}
