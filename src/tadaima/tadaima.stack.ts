import { DiscordSlashCommand } from '@/shared/discord-slash-command/discord-slash-command';
import { EventsSource } from '@/shared/event-source';
import { commonFunctionEnvironment } from '@/shared/functions/common-env';
import { commonFunctionProps } from '@/shared/functions/common-props';
import type { AppInfo } from '@/types';
import type { StackProps } from 'aws-cdk-lib';
import { Aspects, Duration, RemovalPolicy, Stack, Tag } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import type { Construct } from 'constructs';
import { tadaimaCommand } from './commands';
import { TadaimaFunction } from './tadaima-function';

const MODULE = 'tadaima';

export interface TadaimaProps extends StackProps, AppInfo {}

export class Tadaima extends Stack {
  constructor(scope: Construct, id: string, props: TadaimaProps) {
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

    const command = new DiscordSlashCommand(this, 'TadaimaCommand', {
      ...props,
      command: tadaimaCommand,
    });

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/${appName}/${appStage}/${MODULE}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const tadaimaHandler = new TadaimaFunction(this, 'TadaimaHandler', {
      ...commonFunctionProps,
      memorySize: 512,
      environment: {
        ...commonFunctionEnvironment(props, MODULE),
      },
      logGroup,
    });

    new Rule(this, 'TadaimaRule', {
      eventBus,
      eventPattern: {
        source: [EventsSource.Interactions],
        detailType: [MODULE],
      },
      targets: [
        new LambdaFunction(tadaimaHandler, {
          maxEventAge: Duration.minutes(1),
          retryAttempts: 2,
          deadLetterQueue,
        }),
      ],
      description: `/${MODULE}`,
    });

    logGroup.node.addDependency(command);
    tadaimaHandler.node.addDependency(command);

    Aspects.of(this).add(new Tag('module', MODULE));
  }
}
