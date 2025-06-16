// import { env } from 'node:process';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { MeidoInteraction } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
// import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
// import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { EventBridgeEvent } from 'aws-lambda';

const tracer = new Tracer();
const logger = new Logger();
// const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
// const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

// const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
// if (!DISCORD_SECRET_NAME) {
//   throw new Error('DISCORD_SECRET_NAME environment variable is not set');
// }

// TODO: change to invoking event
const lambdaHandler = async (event: EventBridgeEvent<'<module>', MeidoInteraction>) => {
  const { application_id, guild_id, token } = event.detail.command;

  // This is enough for any short-time followup messages
  const discordApiClient = new DiscordApiClient(application_id, guild_id);
  await discordApiClient.sendFollowupMessage(
    token,
    "ごめんなさい！ Master-sama didn't trained me yet to handle this. :woman_bowing:"
  );

  // Use only when required to access bot token to send messages without previous interaction
  // const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
  //   transform: 'json',
  // })) as DiscordSecret;

  // const { botToken } = discordSecret;
  // const discordApiClient = new DiscordApiClient(application_id, guild_id, botToken);
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
