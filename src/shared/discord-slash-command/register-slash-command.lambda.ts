import { env } from 'node:process';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { DiscordSecret, OnEventRequest, OnEventResponse } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

const tracer = new Tracer();
const logger = new Logger();
const secretsClient = tracer.captureAWSv3Client(new SecretsManagerClient());
const secretsProvider = new SecretsProvider({ awsSdkV3Client: secretsClient });

const APP_ENV = env.APP_ENV;
if (!APP_ENV) {
  throw new Error('APP_ENV environment variable is not set!');
}

const DISCORD_SECRET_NAME = env.DISCORD_SECRET_NAME;
if (!DISCORD_SECRET_NAME) {
  throw new Error('DISCORD_SECRET_NAME environment variable is not set!');
}

const lambdaHandler = async (event: OnEventRequest): Promise<OnEventResponse | undefined> => {
  const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
    transform: 'json',
  })) as DiscordSecret;
  const discordApiClient = new DiscordApiClient(
    discordSecret.appId,
    discordSecret.guildId,
    discordSecret.botToken,
    logger
  );
  if (APP_ENV !== 'prod' && !discordSecret.guildId) {
    logger.error('Guild ID is required for not prod environments!');
    throw new Error('Guild ID is required for not prod environments!');
  }

  switch (event.RequestType) {
    case 'Create':
    case 'Update': // When we return new physical ID, custom resource framework will call Delete with the old command id itself
      return await onCreate(event, discordApiClient);
    case 'Delete':
      return await onDelete(event, discordApiClient);
    default:
      throw new Error(`Unsupported request type: ${event.RequestType}`);
  }
};

const onCreate = async (event: OnEventRequest, discordApiClient: DiscordApiClient): Promise<OnEventResponse> => {
  const payload = Buffer.from(event.ResourceProperties.command, 'base64').toString('utf-8');
  const command = JSON.parse(payload) as RESTPostAPIChatInputApplicationCommandsJSONBody;
  logger.info('Creating slash command', { command });

  try {
    const response = await discordApiClient.registerCommand(command);
    logger.info('Slash command created', {
      commandId: response.id,
      name: response.name,
      description: response.description,
      options: response.options,
    });
    return {
      PhysicalResourceId: response.id,
      Data: {
        commandId: response.id,
        name: response.name,
        command: event.ResourceProperties.command,
      },
    };
  } catch (error) {
    logger.error('Error creating slash command', { error });
    throw error;
  }
};

const onDelete = async (event: OnEventRequest, apiClient: DiscordApiClient): Promise<OnEventResponse> => {
  const payload = Buffer.from(event.ResourceProperties.command, 'base64').toString('utf-8');
  const command = JSON.parse(payload) as RESTPostAPIChatInputApplicationCommandsJSONBody;
  const { name } = command;
  logger.info('Deleting slash command', { name });

  try {
    // biome-ignore lint/style/noNonNullAssertion: on Delete event, PhysicalResourceId is always set
    await apiClient.deleteCommand(event.PhysicalResourceId!);
  } catch (error) {
    logger.error('Error deleting slash command', { error });
    throw error;
  }

  logger.info('Slash command deleted', { name });
  return {
    PhysicalResourceId: event.PhysicalResourceId,
  };
};

export const handler = middy(lambdaHandler)
  .use(captureLambdaHandler(tracer))
  .use(injectLambdaContext(logger, { clearState: true }));
