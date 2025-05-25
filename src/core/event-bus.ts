import type { AppInfo } from '@/types';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { CloudWatchLogGroup } from 'aws-cdk-lib/aws-events-targets';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface EventsBusProps extends AppInfo {}

export class EventsBus extends Construct {
  constructor(scope: Construct, id: string, props: EventsBusProps) {
    super(scope, id);

    const { appName, appStage } = props;

    const deadLetterQueue = new Queue(this, 'BusDlq', {
      queueName: `${appName}-${appStage}-bus-dlq`,
      retentionPeriod: Duration.days(14),
    });
    // TODO: add DLQ monitoring

    const eventsBus = new EventBus(this, 'EventBus', {
      eventBusName: `${appName}-${appStage}`,
      deadLetterQueue,
    });

    new StringParameter(this, 'EventBusName', {
      parameterName: `/${appName}/${appStage}/event-bus/name`,
      description: 'The name of the event bus',
      stringValue: eventsBus.eventBusName,
    });
    new StringParameter(this, 'EventBusArn', {
      parameterName: `/${appName}/${appStage}/event-bus/arn`,
      description: 'The ARN of the event bus',
      stringValue: eventsBus.eventBusArn,
    });

    if (appStage === 'dev') {
      const devLogGroup = new LogGroup(this, 'DevLogGroup', {
        logGroupName: `${appName}/${appStage}/events`,
        retention: RetentionDays.ONE_WEEK,
        removalPolicy: RemovalPolicy.DESTROY,
      });

      new Rule(this, 'DevLogEventsRule', {
        eventPattern: {
          source: ['*'],
        },
        targets: [new CloudWatchLogGroup(devLogGroup)],
      });
    }
  }
}
