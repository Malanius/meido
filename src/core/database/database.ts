import { Pipe } from '@aws-cdk/aws-pipes-alpha';
import { DynamoDBSource, DynamoDBStartingPosition } from '@aws-cdk/aws-pipes-sources-alpha';
import { EventBridgeTarget } from '@aws-cdk/aws-pipes-targets-alpha';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, StreamViewType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import type { IQueue } from 'aws-cdk-lib/aws-sqs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { EventsSource } from '@/shared/event-source';
import type { AppInfo } from '@/types';

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

    new Pipe(this, 'Pipe', {
      source: new DynamoDBSource(this.table, {
        startingPosition: DynamoDBStartingPosition.LATEST,
        batchSize: 10,
        maximumBatchingWindow: Duration.minutes(1),
        maximumRetryAttempts: 2,
        deadLetterTarget: deadLetterQueue,
      }),
      target: new EventBridgeTarget(eventsBus, {
        source: EventsSource.Database,
      }),
    });

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
