import { DiscordApiClient } from '@/shared/discord-api-client';
import type { MeidoInteraction } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import middy from '@middy/core';
import type { EventBridgeEvent } from 'aws-lambda';
import { getSubscriptionInfo } from './commands/info';

const tracer = new Tracer();
const logger = new Logger();

const DATABASE_TABLE_NAME = process.env.DATABASE_TABLE_NAME;
if (!DATABASE_TABLE_NAME) {
  throw new Error('DATABASE_TABLE_NAME is not set');
}

const lambdaHandler = async (event: EventBridgeEvent<'journal', MeidoInteraction>) => {
  const { application_id, guild_id, token, data } = event.detail.command;
  const { options } = data;

  if (!options || options.length === 0) {
    logger.error('Received command without options!', {
      command: event.detail.command,
    });
    throw new Error('Received command without options!');
  }

  const action = options[0].name;
  const message = await (async () => {
    switch (action) {
      case 'info':
        return await getSubscriptionInfo(event.detail.command);
      case 'subscribe':
      // TODO: Implement subscribe logic
      case 'unsubscribe':
        // TODO: Implement unsubscribe logic
        return `ごめんなさい！ Master-sama didn't trained me yet how to handle \`${action}\`. :woman_bowing:`;
      default:
        logger.error('Received unknown subcommand!', {
          command: event.detail.command,
        });
        throw new Error(`Unknown subcommand: ${action}`);
    }
  })();

  logger.debug('Sending followup message', {
    message,
  });
  const discordApiClient = new DiscordApiClient(application_id, guild_id);
  await discordApiClient.sendFollowupMessage(token, message);
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
