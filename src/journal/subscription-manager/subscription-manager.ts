import { EventsSource } from '@/shared/event-source';
import { commonFunctionEnvironment, commonFunctionProps } from '@/shared/functions';
import type { AppInfo } from '@/types';
import { Aspects, Duration, Tag } from 'aws-cdk-lib';
import type { ITableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { type IEventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { SubscriptionManagerFunction } from './subscription-manager-function';

const MODULE = 'journal';

export interface SubscriptionManagerProps extends AppInfo {
  eventBus: IEventBus;
  database: ITableV2;
}

export class SubscriptionManager extends Construct {
  constructor(scope: Construct, id: string, props: SubscriptionManagerProps) {
    super(scope, id);

    const { appName, appStage, eventBus, database } = props;

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/${appName}/${appStage}/journal/subscription-manager`,
    });

    const subHandler = new SubscriptionManagerFunction(this, 'SubscriptionManagerFunction', {
      ...commonFunctionProps,
      environment: {
        ...commonFunctionEnvironment(props, MODULE),
        DATABASE_TABLE_NAME: database.tableName,
      },
      logGroup,
    });

    database.grantReadWriteData(subHandler);

    new Rule(this, 'SubscriptionManagerRule', {
      eventBus,
      eventPattern: {
        source: [EventsSource.Interactions],
        detailType: [MODULE],
      },
      targets: [
        new LambdaFunction(subHandler, {
          maxEventAge: Duration.minutes(1),
          retryAttempts: 2,
        }),
      ],
      description: `/${MODULE}/subscription-manager`,
    });

    Aspects.of(this).add(new Tag('module', MODULE));
  }
}
