import {
  commonFunctionEnvironment,
  commonFunctionProps,
} from '@/shared/functions';
import type { AppInfo } from '@/types';
import type { SlashCommandResourceProps } from '@/types/slash-command-resource-props';
import { CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import { TableV2 } from 'aws-cdk-lib/aws-dynamodb';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { RegisterSlashCommandFunction } from './register-slash-command-function';

export interface DiscordSlashCommandProps
  extends AppInfo,
    SlashCommandResourceProps {}

export class DiscordSlashCommand extends Construct {
  constructor(scope: Construct, id: string, props: DiscordSlashCommandProps) {
    super(scope, id);

    const { appName, appStage, name } = props;

    const discordSecret = Secret.fromSecretNameV2(
      this,
      'DiscordSecret',
      `/${appName}/${appStage}/discord`
    );

    const tableName = StringParameter.fromStringParameterName(
      this,
      'TableName',
      `/${appName}/${appStage}/database/name`
    ).stringValue;

    const database = TableV2.fromTableName(this, 'Database', tableName);

    const logGroup = new LogGroup(this, 'RegisterSlashCommandLogGroup', {
      logGroupName: `/${appName}/${appStage}/register-slash-command/${name}`,
      retention: RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const registerSlashCommandFunction = new RegisterSlashCommandFunction(
      this,
      'RegisterSlashCommandFunction',
      {
        ...commonFunctionProps,
        environment: {
          ...commonFunctionEnvironment(props, 'RegisterSlashCommand'),
          DISCORD_SECRET_NAME: discordSecret.secretName,
          DATABASE_TABLE_NAME: database.tableName,
        },
        logGroup,
      }
    );

    discordSecret.grantRead(registerSlashCommandFunction);
    database.grantReadWriteData(registerSlashCommandFunction);

    const provider = new Provider(this, 'RegisterSlashCommandProvider', {
      onEventHandler: registerSlashCommandFunction,
      logGroup,
    });

    new CustomResource(this, 'DiscordSlashCommandCustomResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::DiscordSlashCommand',
      properties: props,
    });
  }
}
