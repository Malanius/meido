import type { Logger } from '@aws-lambda-powertools/logger';
import axios, { type AxiosInstance, type AxiosResponse, type RawAxiosRequestHeaders } from 'axios';
import {
  type APIApplicationCommand,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIWebhookWithTokenJSONBody,
} from 'discord-api-types/v10';

const SEND_FOLLOWUP_MESSAGE_ENDPOINT = '/webhooks/:app_id/:interaction_token';
const REGISTER_GLOBAL_COMMAND_ENDPOINT = 'applications/:app_id/commands';
const REGISTER_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands';
const DELETE_GLOBAL_COMMAND_ENDPOINT = 'applications/:app_id/commands/:command_id';
const DELETE_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands/:command_id';

export class DiscordApiClient {
  private readonly api: AxiosInstance;
  private readonly appId: string;
  private readonly guildId?: string;
  private readonly botToken?: string;
  private readonly logger?: Logger;

  constructor(appId: string, guildId?: string, botToken?: string, logger?: Logger) {
    this.appId = appId;
    this.guildId = guildId;
    this.botToken = botToken;

    let headers: RawAxiosRequestHeaders = {};
    if (botToken) {
      headers = {
        Authorization: `Bot ${botToken}`,
      };
    }

    this.api = axios.create({
      baseURL: 'https://discord.com/api/v10',
      headers,
    });
    this.logger = logger;

    if (logger) {
      this.api.interceptors.request.use((request) => {
        logger.info('Sending request to Discord API', {
          url: request.url,
          method: request.method,
          data: request.data,
        });
        return request;
      });

      this.api.interceptors.response.use((response) => {
        logger.info('Received response from Discord API', {
          url: response.config.url,
          status: response.status,
          data: response.data,
        });
        return response;
      });
    }
  }

  async sendFollowupMessage(interactionToken: string, message: string) {
    const endpoint = SEND_FOLLOWUP_MESSAGE_ENDPOINT.replace(':app_id', this.appId).replace(
      ':interaction_token',
      interactionToken
    );
    await this.api.post(endpoint, {
      content: message,
    } as RESTPostAPIWebhookWithTokenJSONBody);
  }

  async registerCommand(command: RESTPostAPIChatInputApplicationCommandsJSONBody) {
    if (!this.botToken) {
      throw new Error('Bot token is required to register commands!');
    }
    const { name, description, options } = command;
    let endpoint = this.guildId ? REGISTER_GUILD_COMMAND_ENDPOINT : REGISTER_GLOBAL_COMMAND_ENDPOINT;
    endpoint = endpoint.replace(':app_id', this.appId);
    if (this.guildId) {
      endpoint = endpoint.replace(':guild_id', this.guildId);
    }
    this.logger?.info('Registering command', { endpoint, name, description, options });
    const response: AxiosResponse<APIApplicationCommand> = await axios.post(endpoint, {
      type: ApplicationCommandType.ChatInput, // Supporting slash commands only for now
      name,
      description,
      options,
    });
    return response.data;
  }

  async deleteCommand(commandId: string) {
    if (!this.botToken) {
      throw new Error('Bot token is required to delete commands!');
    }
    let endpoint = this.guildId ? DELETE_GUILD_COMMAND_ENDPOINT : DELETE_GLOBAL_COMMAND_ENDPOINT;
    endpoint = endpoint.replace(':app_id', this.appId);
    if (this.guildId) {
      endpoint = endpoint.replace(':guild_id', this.guildId);
    }
    endpoint = endpoint.replace(':command_id', commandId);
    this.logger?.info('Deleting command', { endpoint });
    await this.api.delete(endpoint);
  }
}
