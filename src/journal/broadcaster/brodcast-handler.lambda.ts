import { env } from 'node:process';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { EventBridgeEvent, StreamRecord } from 'aws-lambda';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { DiscordSecret } from '@/types';
import { getAllSubscriptions } from '../subscription-manager/subscription.db';

const tracer = new Tracer();
const logger = new Logger();
const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
if (!DISCORD_SECRET_NAME) {
  throw new Error('DISCORD_SECRET_NAME environment variable is not set');
}

const checkIncomingEvent = (event: EventBridgeEvent<'journal', { dynamodb: StreamRecord }>) => {
  const { NewImage } = event.detail.dynamodb;

  if (!NewImage) {
    // This should be ivoked on record creation, NewImage should be present
    logger.error('Received event without NewImage!', {
      event,
    });
    throw new Error('Received event without NewImage!');
  }
};

const lambdaHandler = async (event: EventBridgeEvent<'journal', { dynamodb: StreamRecord }>) => {
  checkIncomingEvent(event);

  const subscriptions = await getAllSubscriptions();
  if (subscriptions.length === 0) {
    logger.info('No subscriptions found, skipping broadcast');
    return;
  }
  console.info(`Found ${subscriptions.length} subscriptions`);
  console.debug(subscriptions);

  // Use only when required to access bot token to send messages without previous interaction
  const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
    transform: 'json',
  })) as DiscordSecret;

  const { appId, botToken } = discordSecret;
  const discordApiClient = new DiscordApiClient(appId, undefined, botToken, logger);
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
