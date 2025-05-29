import { commonFunctionEnvironment, commonFunctionProps } from '@/shared/functions';
import type { AppInfo } from '@/types';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import type { IEventBus } from 'aws-cdk-lib/aws-events';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import type { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { InteractionHandlerFunction } from './interaction-handler-function';

export interface InteractionHandlerProps extends AppInfo {
  discordSecrets: ISecret;
  eventsBus: IEventBus;
}

export class InteractionHandler extends Construct {
  constructor(scope: Construct, id: string, props: InteractionHandlerProps) {
    super(scope, id);

    const { appName, appStage, discordSecrets, eventsBus } = props;

    const logGroup = new LogGroup(this, 'LogGroup', {
      logGroupName: `/${appName}/${appStage}/interaction-handler`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const interactionHandler = new InteractionHandlerFunction(this, 'InteractionHandler', {
      ...commonFunctionProps,
      environment: {
        ...commonFunctionEnvironment(props, 'core'),
        DISCORD_SECRET_NAME: discordSecrets.secretName,
        EVENTS_BUS_NAME: eventsBus.eventBusName,
      },
      logGroup,
    });

    const url = interactionHandler.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    discordSecrets.grantRead(interactionHandler);
    eventsBus.grantPutEventsTo(interactionHandler);

    new CfnOutput(this, 'FunctionUrl', {
      description: 'The URL of the interaction handler function',
      value: url.url,
    });
  }
}
