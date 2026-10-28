import { CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

import type { AppInfo } from '@/common/app-info';
import { commonFunctionEnvironment, commonFunctionProps } from '@/common/lambda';

import { RegisterSlashCommandFunction } from './register-slash-command-function';

export interface DiscordSlashCommandProps extends AppInfo {
  command: RESTPostAPIChatInputApplicationCommandsJSONBody;
}

export class DiscordSlashCommand extends Construct {
  constructor(scope: Construct, id: string, props: DiscordSlashCommandProps) {
    super(scope, id);

    const { appName, appEnv, command } = props;

    const discordSecret = Secret.fromSecretNameV2(this, 'DiscordSecret', `/${appName}/${appEnv}/discord`);

    const logGroup = new LogGroup(this, 'RegisterSlashCommandLogGroup', {
      logGroupName: `/${appName}/${appEnv}/register-slash-command/${command.name}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const registerSlashCommandFunction = new RegisterSlashCommandFunction(this, 'RegisterSlashCommandFunction', {
      ...commonFunctionProps,
      environment: {
        ...commonFunctionEnvironment(props, 'RegisterSlashCommand'),
        DISCORD_SECRET_NAME: discordSecret.secretName,
      },
      logGroup,
    });

    discordSecret.grantRead(registerSlashCommandFunction);

    const provider = new Provider(this, 'RegisterSlashCommandProvider', {
      onEventHandler: registerSlashCommandFunction,
      logGroup,
    });

    new CustomResource(this, 'DiscordSlashCommandCustomResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::DiscordSlashCommand',
      properties: {
        command: Buffer.from(JSON.stringify(command)).toString('base64'),
        ...command, // For visibility in diff
      },
    });
  }
}
