import { env } from 'node:process';
import type { DiscordSecret, OnEventRequest, OnEventResponse, SlashCommandResourceProps } from '@/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { SecretsProvider } from '@aws-lambda-powertools/parameters/secrets';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import middy from '@middy/core';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { type APIApplicationCommand, ApplicationCommandType } from 'discord-api-types/v10';
import { discordApi } from '../axios';

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

const REGISTER_GLOBAL_COMMAND_ENDPOINT = 'applications/:app_id/commands';
const REGISTER_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands';
const DELETE_COMMAND_ENDPOINT = 'applications/:app_id/commands/:command_id';
const DELETE_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands/:command_id';

const lambdaHandler = async (event: OnEventRequest): Promise<OnEventResponse | undefined> => {
  const discordSecret = (await secretsProvider.get(DISCORD_SECRET_NAME, {
    transform: 'json',
  })) as DiscordSecret;
  const botToken = discordSecret.botToken;
  const apiClient = discordApi(botToken);
  const appId = discordSecret.appId;
  const guildId = discordSecret.guildId;
  if (APP_ENV !== 'prod' && !guildId) {
    logger.error('Guild ID is required for not prod environments!');
    throw new Error('Guild ID is required for not prod environments!');
  }

  switch (event.RequestType) {
    case 'Create':
    case 'Update': // Discord will overwrite the command if it already exists
      return await onCreate(event, apiClient, appId, guildId);
    case 'Delete':
      return await onDelete(event, apiClient, appId, guildId);
    default:
      throw new Error(`Unsupported request type: ${event.RequestType}`);
  }
};

const onCreate = async (
  event: OnEventRequest,
  apiClient: AxiosInstance,
  appId: string,
  guildId?: string
): Promise<OnEventResponse> => {
  const props = event.ResourceProperties as unknown as SlashCommandResourceProps;
  const { name, description, options } = props;
  logger.info('Creating slash command', { name, description, options });
  let endpoint = guildId ? REGISTER_GUILD_COMMAND_ENDPOINT : REGISTER_GLOBAL_COMMAND_ENDPOINT;
  endpoint = endpoint.replace(':app_id', appId);
  if (guildId) {
    endpoint = endpoint.replace(':guild_id', guildId);
  }

  try {
    const response: AxiosResponse<APIApplicationCommand> = await apiClient.post(endpoint, {
      type: ApplicationCommandType.ChatInput, // Supporting slash commands only for now
      name,
      description,
      options,
    });
    logger.info('Slash command created', {
      commandId: response.data.id,
      name: response.data.name,
      description: response.data.description,
      options: response.data.options,
    });
    return {
      PhysicalResourceId: response.data.id,
      Data: {
        commandId: response.data.id,
        name: response.data.name,
      },
    };
  } catch (error) {
    logger.error('Error creating slash command', { error });
    throw error;
  }
};

const onDelete = async (
  event: OnEventRequest,
  apiClient: AxiosInstance,
  appId: string,
  guildId?: string
): Promise<OnEventResponse> => {
  const props = event.ResourceProperties as unknown as SlashCommandResourceProps;
  const { name } = props;
  logger.info('Deleting slash command', { name });
  let endpoint = guildId ? DELETE_GUILD_COMMAND_ENDPOINT : DELETE_COMMAND_ENDPOINT;
  endpoint = endpoint.replace(':app_id', appId);
  if (guildId) {
    endpoint = endpoint.replace(':guild_id', guildId);
  }
  // biome-ignore lint/style/noNonNullAssertion: on Delete event, PhysicalResourceId is always set
  endpoint = endpoint.replace(':command_id', event.PhysicalResourceId!);

  try {
    await apiClient.delete(endpoint);
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
