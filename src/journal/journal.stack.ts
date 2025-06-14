import { DiscordSlashCommand } from '@/shared/discord-slash-command/discord-slash-command';
import type { AppInfo } from '@/types';
import { Stack, type StackProps } from 'aws-cdk-lib';
import { EventBus } from 'aws-cdk-lib/aws-events';
import type { Construct } from 'constructs';
import { journalCommand } from './commands';

export interface JournalProps extends StackProps, AppInfo {}

export class Journal extends Stack {
  constructor(scope: Construct, id: string, props: JournalProps) {
    super(scope, id, props);

    const { appName, appStage } = props;
    const eventsBusName = `${appName}-${appStage}`;

    const eventBus = EventBus.fromEventBusName(this, 'EventsBus', eventsBusName);

    const command = new DiscordSlashCommand(this, 'JournalCommand', {
      ...props,
      command: journalCommand,
    });

    // TODO: create subscription manager
    // TODO: create journal broadcaster
    // TODO: create custom resource to insert journal entries into database
  }
}
