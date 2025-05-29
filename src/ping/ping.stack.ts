import { EVENTS_SOURCE } from '@/shared/constants';
import { DiscordSlashCommand } from '@/shared/discord-slash-command/discord-slash-command';
import { commonFunctionEnvironment } from '@/shared/functions/common-env';
import { commonFunctionProps } from '@/shared/functions/common-props';
import type { AppInfo } from '@/types';
import type { StackProps } from 'aws-cdk-lib';
import { Aspects, Duration, RemovalPolicy, Stack, Tag } from 'aws-cdk-lib';
import { EventBus, Rule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import type { Construct } from 'constructs';
import { PingFunction } from './ping-function';

const MODULE = 'ping';

export interface PingProps extends StackProps, AppInfo {}

export class Ping extends Stack {
  constructor(scope: Construct, id: string, props: PingProps) {
    super(scope, id, props);

    const { appName, appStage } = props;
    const eventsBusName = `${appName}-${appStage}`;

    const eventBus = EventBus.fromEventBusName(this, 'EventsBus', eventsBusName);
    const discordSecrets = Secret.fromSecretNameV2(this, 'DiscordSecrets', `/${appName}/${appStage}/discord`);

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/${appName}/${appStage}/${MODULE}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const pingHandler = new PingFunction(this, 'PingHandler', {
      ...commonFunctionProps,
      environment: {
        ...commonFunctionEnvironment(props, MODULE),
        DISCORD_SECRET_NAME: discordSecrets.secretName,
      },
      logGroup,
    });

    discordSecrets.grantRead(pingHandler);

    new Rule(this, 'PingRule', {
      eventBus,
      eventPattern: {
        source: [EVENTS_SOURCE],
        detailType: [MODULE],
      },
      targets: [
        new LambdaFunction(pingHandler, {
          maxEventAge: Duration.minutes(1),
          retryAttempts: 2,
        }),
      ],
    });

    new DiscordSlashCommand(this, 'Ping', {
      ...props,
      name: 'ping',
      description: 'Responds with pong!',
    });

    Aspects.of(this).add(new Tag('module', 'ping'));
  }
}
