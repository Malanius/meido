import { env } from 'node:process';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { DiscordSecret } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { EventBridgeEvent } from 'aws-lambda';
import type { APIApplicationCommand, APIApplicationCommandInteraction } from 'discord-api-types/v10';

const tracer = new Tracer();
const logger = new Logger();
const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
if (!DISCORD_SECRET_NAME) {
  throw new Error('DISCORD_SECRET_NAME environment variable is not set');
}

const lambdaHandler = async (event: EventBridgeEvent<'ping', APIApplicationCommandInteraction>) => {
  const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
    transform: 'json',
  })) as DiscordSecret;

  const discordApiClient = new DiscordApiClient(discordSecret.appId, discordSecret.botToken, discordSecret.guildId);

  const eventTimestamp = new Date(event.time);
  const now = new Date();
  const diff = now.getTime() - eventTimestamp.getTime();
  const diffInSeconds = diff / 1000;

  await discordApiClient.sendFollowupMessage(
    event.detail.token,
    `🏓 Pong! Serverless took ~${diffInSeconds}s to respond.`
  );
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
