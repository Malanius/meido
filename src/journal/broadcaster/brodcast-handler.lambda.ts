import { env } from 'node:process';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { EventBridgeEvent, StreamRecord } from 'aws-lambda';
import { getAllSubscriptions, type SubscriptionEntry } from '@/journal/subscription-manager/subscription.db';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { DiscordSecret } from '@/types';

const tracer = new Tracer();
const logger = new Logger();
const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
if (!DISCORD_SECRET_NAME) {
  throw new Error('DISCORD_SECRET_NAME environment variable is not set');
}

const getMessage = (event: EventBridgeEvent<'journal', { dynamodb: StreamRecord }>) => {
  const { NewImage } = event.detail.dynamodb;

  if (!NewImage) {
    // This should be ivoked on record creation, NewImage should be present
    logger.error('Received event without NewImage!', {
      event,
    });
    throw new Error('Received event without NewImage!');
  }

  const message = NewImage.content.S;
  if (!message) {
    logger.error('No content found in the journal entry!', {
      event,
    });
    throw new Error('No content found in the journal entry!');
  }

  return message;
};

const broadcastGuilds = async (subs: SubscriptionEntry[], message: string, discordApiClient: DiscordApiClient) => {
  for (const sub of subs) {
    const channelId = sub.channel_id;
    try {
      logger.info(`Sending journal entry to channel ${channelId}`);
      // biome-ignore lint/style/noNonNullAssertion: it's already filtered above
      await discordApiClient.postMessageToChannel(channelId!, message);
      logger.info(`Successfully sent journal entry to channel ${channelId}`);
    } catch (error) {
      logger.error(`Failed to send journal entry to channel ${channelId}`, {
        error,
      });
    }
  }
};

const lambdaHandler = async (event: EventBridgeEvent<'journal', { dynamodb: StreamRecord }>) => {
  const message = getMessage(event);

  const subscriptions = await getAllSubscriptions();
  if (subscriptions.length === 0) {
    logger.info('No subscriptions found, skipping broadcast');
    return;
  }
  console.info(`Found ${subscriptions.length} subscriptions`);
  console.debug(subscriptions);

  const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
    transform: 'json',
  })) as DiscordSecret;

  const { appId, botToken } = discordSecret;
  const discordApiClient = new DiscordApiClient(appId, undefined, botToken, logger);

  const guildSubscriptions = subscriptions.filter((sub) => sub.sk.startsWith('guild#'));
  if (guildSubscriptions.length !== 0) {
    await broadcastGuilds(guildSubscriptions, message, discordApiClient);
  } else {
    logger.info('No guild subscriptions found, skipping guilds broadcast');
  }

  const userSubscriptions = subscriptions.filter((sub) => sub.sk.startsWith('user#'));
  if (userSubscriptions.length !== 0) {
    // TODO: implement user broadcast
  } else {
    logger.info('No user subscriptions found, skipping users broadcast');
  }
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
