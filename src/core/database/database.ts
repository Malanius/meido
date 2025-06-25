import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, StreamViewType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { IQueue } from 'aws-cdk-lib/aws-sqs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { commonFunctionEnvironment, commonFunctionProps } from '@/shared/functions';
import type { AppInfo } from '@/types';
import { DynamoBridgeFunction } from './dynamo-bridge-function';

export interface DatabaseProps extends AppInfo {
  eventsBus: IEventBus;
  deadLetterQueue: IQueue;
}

export class Database extends Construct {
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { appName, appStage, eventsBus, deadLetterQueue } = props;

    this.table = new TableV2(this, 'Table', {
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
      timeToLiveAttribute: 'expiresAt',
      dynamoStream: StreamViewType.NEW_AND_OLD_IMAGES, // Meido is interested both in new, updated and deleted items
      removalPolicy: appStage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      deletionProtection: appStage === 'prod',
    });

    const dynamoBridge = new DynamoBridgeFunction(this, 'DynamoBridge', {
      ...commonFunctionProps,
      environment: {
        ...commonFunctionEnvironment(props, 'core'),
        EVENTS_BUS_NAME: eventsBus.eventBusName,
      },
      logGroup: new LogGroup(this, 'LogGroup', {
        logGroupName: `/${appName}/${appStage}/database/dynamo-bridge`,
        retention: RetentionDays.ONE_DAY,
      }),
    });

    eventsBus.grantPutEventsTo(dynamoBridge);

    dynamoBridge.addEventSource(
      new DynamoEventSource(this.table, {
        startingPosition: StartingPosition.LATEST,
        reportBatchItemFailures: true,
        retryAttempts: 2,
        onFailure: new SqsDestination(deadLetterQueue),
      })
    );

    new StringParameter(this, 'TableName', {
      parameterName: `/${appName}/${appStage}/database/name`,
      stringValue: this.table.tableName,
    });

    new StringParameter(this, 'TableArn', {
      parameterName: `/${appName}/${appStage}/database/arn`,
      stringValue: this.table.tableArn,
    });
  }
}
