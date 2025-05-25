import {
  commonFunctionEnvironment,
  commonFunctionProps,
} from '@/shared/functions';
import type { AppInfo } from '@/types';
import type { SlashCommandResourceProps } from '@/types/slash-command-resource-props';
import { CustomResource } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import { RegisterSlashCommandFunction } from './register-slash-command-function';

export interface DiscordSlashCommandProps
  extends AppInfo,
    SlashCommandResourceProps {}

export class DiscordSlashCommand extends Construct {
  constructor(scope: Construct, id: string, props: DiscordSlashCommandProps) {
    super(scope, id);

    const { appName, appStage } = props;

    const discordSecret = new Secret(this, 'DiscordSecret', {
      secretName: `/${appName}/${appStage}/discord-secret`,
    });

    const registerSlashCommandFunction = new RegisterSlashCommandFunction(
      this,
      'RegisterSlashCommandFunction',
      {
        ...commonFunctionProps,
        environment: {
          ...commonFunctionEnvironment(props, 'RegisterSlashCommand'),
          DISCORD_SECRET_NAME: discordSecret.secretName,
        },
      }
    );

    discordSecret.grantRead(registerSlashCommandFunction);

    const provider = new Provider(this, 'RegisterSlashCommandProvider', {
      onEventHandler: registerSlashCommandFunction,
      logGroup: new LogGroup(this, 'RegisterSlashCommandLogGroup', {
        logGroupName: `/${appName}/${appStage}/register-slash-command`,
        retention: RetentionDays.ONE_DAY,
      }),
    });

    new CustomResource(this, 'DiscordSlashCommandCustomResource', {
      serviceToken: provider.serviceToken,
      resourceType: 'Custom::DiscordSlashCommand',
      properties: props,
    });
  }
}
