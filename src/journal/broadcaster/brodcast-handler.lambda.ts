import { env } from 'node:process';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { EventBridgeEvent } from 'aws-lambda';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { DiscordSecret } from '@/types';
import type { DynamoEvent } from '@/types/dynamo-event';

const tracer = new Tracer();
const logger = new Logger();
const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
if (!DISCORD_SECRET_NAME) {
  throw new Error('DISCORD_SECRET_NAME environment variable is not set');
}

const lambdaHandler = async (event: EventBridgeEvent<'journal', DynamoEvent>) => {
  const { newImage } = event.detail;

  if (!newImage) {
    // This should be ivoked on record creation, newImage should be present
    logger.error('Received event without newImage!', {
      event,
    });
    throw new Error('Received event without newImage!');
  }

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
