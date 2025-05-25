import type { AppInfo } from '@/types';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface DatabaseProps extends AppInfo {}

export class Database extends Construct {
  public readonly table: TableV2;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { appName, appStage } = props;

    this.table = new TableV2(this, 'Table', {
      partitionKey: {
        name: 'pk',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'sk',
        type: AttributeType.STRING,
      },
      removalPolicy:
        appStage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      deletionProtection: appStage === 'prod',
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
