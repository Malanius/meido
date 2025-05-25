import {
  commonFunctionEnvironment,
  commonFunctionProps,
} from '@/shared/functions';
import type { AppInfo } from '@/types';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import type { ITableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { InteractionHandlerFunction } from './interaction-handler-function';

export interface InteractionHandlerProps extends AppInfo {
  discordSecrets: ISecret;
  database: ITableV2;
}

export class InteractionHandler extends Construct {
  constructor(scope: Construct, id: string, props: InteractionHandlerProps) {
    super(scope, id);

    const { appName, appStage, discordSecrets, database } = props;

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/${appName}/${appStage}/interaction-handler`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const interactionHandler = new InteractionHandlerFunction(
      this,
      'InteractionHandler',
      {
        ...commonFunctionProps,
        environment: {
          ...commonFunctionEnvironment(props, 'core'),
          DATABASE_TABLE_NAME: database.tableName,
          DISCORD_SECRET_NAME: discordSecrets.secretName,
        },
        logGroup,
      }
    );

    const url = interactionHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    discordSecrets.grantRead(interactionHandler);
    database.grantReadData(interactionHandler);

    new CfnOutput(this, 'FunctionUrl', {
      description: 'The URL of the interaction handler function',
      value: url.url,
    });
  }
}
