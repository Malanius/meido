import axios, { type RawAxiosRequestHeaders, type AxiosInstance, type AxiosResponse } from 'axios';
import {
  type APIApplicationCommand,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type RESTPostAPIWebhookWithTokenJSONBody,
} from 'discord-api-types/v10';

const SEND_FOLLOWUP_MESSAGE_ENDPOINT = '/webhooks/:app_id/:interaction_token';
const REGISTER_GLOBAL_COMMAND_ENDPOINT = 'applications/:app_id/commands';
const REGISTER_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands';
const DELETE_COMMAND_ENDPOINT = 'applications/:app_id/commands/:command_id';
const DELETE_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands/:command_id';

export class DiscordApiClient {
  private readonly api: AxiosInstance;
  private readonly appId: string;
  private readonly guildId?: string;
  private readonly botToken?: string;

  constructor(appId: string, guildId?: string, botToken?: string) {
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
    let endpoint = this.guildId ? DELETE_GUILD_COMMAND_ENDPOINT : DELETE_COMMAND_ENDPOINT;
    endpoint = endpoint.replace(':app_id', this.appId);
    if (this.guildId) {
      endpoint = endpoint.replace(':guild_id', this.guildId);
    }
    endpoint = endpoint.replace(':command_id', commandId);
    await this.api.delete(endpoint);
  }
}
