import { env } from 'node:process';
import { DiscordApiClient } from '@/shared/discord-api-client';
import type { DiscordSecret, OnEventRequest, OnEventResponse, SlashCommandResourceProps } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';

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
      return await onCreate(event, discordApiClient);
    case 'Update':
      return await onUpdate(event, discordApiClient);
    case 'Delete':
      return await onDelete(event, discordApiClient);
    default:
      throw new Error(`Unsupported request type: ${event.RequestType}`);
  }
};

const onCreate = async (event: OnEventRequest, discordApiClient: DiscordApiClient): Promise<OnEventResponse> => {
  const props = event.ResourceProperties as unknown as SlashCommandResourceProps;
  const { name, description, options } = props;
  logger.info('Creating slash command', { name, description, options });

  try {
    const response = await discordApiClient.registerCommand({
      name,
      description,
      options,
    });
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
      },
    };
  } catch (error) {
    logger.error('Error creating slash command', { error });
    throw error;
  }
};

const onUpdate = async (event: OnEventRequest, apiClient: DiscordApiClient): Promise<OnEventResponse> => {
  const oldProps = event.OldResourceProperties as unknown as SlashCommandResourceProps;
  const newProps = event.ResourceProperties as unknown as SlashCommandResourceProps;
  const { name, description, options } = newProps;
  logger.info('Updating slash command', { name, description, options });

  if (oldProps.name !== newProps.name) {
    logger.info('Name is different, deleting old command and creating new one');
    await onDelete(event, apiClient);
  }

  return await onCreate(event, apiClient);
};

const onDelete = async (event: OnEventRequest, apiClient: DiscordApiClient): Promise<OnEventResponse> => {
  const props = event.ResourceProperties as unknown as SlashCommandResourceProps;
  const { name } = props;
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
