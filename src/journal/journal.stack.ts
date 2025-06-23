import { DiscordSlashCommand } from '@/shared/discord-slash-command/discord-slash-command';
import type { AppInfo } from '@/types';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { EventBus } from 'aws-cdk-lib/aws-events';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import type { Construct } from 'constructs';
import { journalCommand } from './commands';
import { SubscriptionManager } from './subscription-manager/subscription-manager';

export interface JournalProps extends StackProps, AppInfo {}

export class Journal extends Stack {
  constructor(scope: Construct, id: string, props: JournalProps) {
    super(scope, id, props);

    const { appName, appStage } = props;
    const eventsBusName = `${appName}-${appStage}`;
    const region = Stack.of(this).region;
    const account = Stack.of(this).account;

    const eventBus = EventBus.fromEventBusName(this, 'EventsBus', eventsBusName);

    const deadLetterQueue = Queue.fromQueueArn(
      this,
      'DeadLetterQueue',
      `arn:aws:sqs:${region}:${account}:${appName}-${appStage}-dlq`
    );

    const databaseTableName = StringParameter.fromStringParameterName(
      this,
      'DatabaseTableName',
      `/${appName}/${appStage}/database/name`
    ).stringValue;
    const database = TableV2.fromTableName(this, 'Database', databaseTableName);

    const command = new DiscordSlashCommand(this, 'JournalCommand', {
      ...props,
      command: journalCommand,
    });

    const subscriptionManager = new SubscriptionManager(this, 'SubscriptionManager', {
      ...props,
      eventBus,
      database,
      deadLetterQueue,
    });
    subscriptionManager.node.addDependency(command);

    // TODO: create custom resource to insert journal entries into database
    // TODO: create journal broadcaster
  }
}
