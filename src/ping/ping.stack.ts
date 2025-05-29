import { DiscordSlashCommand } from '@/shared/discord-slash-command/discord-slash-command';
import type { AppInfo } from '@/types';
import type { StackProps } from 'aws-cdk-lib';
import { Aspects, Stack, Tag } from 'aws-cdk-lib';
import type { Construct } from 'constructs';

export interface PingProps extends StackProps, AppInfo {}

export class Ping extends Stack {
  constructor(scope: Construct, id: string, props: PingProps) {
    super(scope, id, props);

    new DiscordSlashCommand(this, 'Ping', {
      ...props,
      name: 'ping',
      description: 'Responds with pong!',
    });

    Aspects.of(this).add(new Tag('module', 'ping'));
  }
}
