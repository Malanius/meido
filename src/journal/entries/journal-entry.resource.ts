import { RemovalPolicy } from 'aws-cdk-lib';
import type { ITableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import type { AppInfo } from '@/types';
import type { JournalEntry } from './entries';

export interface JournalEntryResourceProps extends AppInfo {
  database: ITableV2;
  entry: JournalEntry;
}

export class JournalEntryResource extends Construct {
  constructor(scope: Construct, id: string, props: JournalEntryResourceProps) {
    super(scope, id);

    const { appName, appStage, database, entry } = props;

    const entryKey = {
      pk: { S: `journal#entry#${entry.version}` },
      sk: { S: 'META' },
    };

    const parameters = {
      TableName: database.tableName,
      Item: {
        ...entryKey,
        content: { S: entry.content },
      },
    };

    new AwsCustomResource(this, 'EntryResource', {
      resourceType: 'Custom::JournalEntry',
      onCreate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters,
        physicalResourceId: PhysicalResourceId.of(entryKey.pk.S),
      },
      onUpdate: {
        service: 'DynamoDB',
        action: 'putItem',
        parameters,
        physicalResourceId: PhysicalResourceId.of(entryKey.pk.S),
      },
      onDelete: {
        service: 'DynamoDB',
        action: 'deleteItem',
        parameters: {
          TableName: database.tableName,
          Key: entryKey,
        },
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [database.tableArn],
      }),
      logGroup: new LogGroup(this, 'LogGroup', {
        logGroupName: `/${appName}/${appStage}/journal/entries/${entry.version}`,
        retention: RetentionDays.ONE_DAY,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });
  }
}
