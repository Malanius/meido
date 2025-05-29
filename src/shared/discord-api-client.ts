import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import {
  type APIApplicationCommand,
  ApplicationCommandType,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';

const REGISTER_GLOBAL_COMMAND_ENDPOINT = 'applications/:app_id/commands';
const REGISTER_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands';
const DELETE_COMMAND_ENDPOINT = 'applications/:app_id/commands/:command_id';
const DELETE_GUILD_COMMAND_ENDPOINT = 'applications/:app_id/guilds/:guild_id/commands/:command_id';

export class DiscordApiClient {
  private readonly api: AxiosInstance;
  private readonly appId: string;
  private readonly guildId?: string;

  constructor(appId: string, botToken: string, guildId?: string) {
    this.appId = appId;
    this.guildId = guildId;
    this.api = axios.create({
      baseURL: 'https://discord.com/api/v10',
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
  }

  async registerCommand(command: RESTPostAPIChatInputApplicationCommandsJSONBody) {
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
    let endpoint = this.guildId ? DELETE_GUILD_COMMAND_ENDPOINT : DELETE_COMMAND_ENDPOINT;
    endpoint = endpoint.replace(':app_id', this.appId);
    if (this.guildId) {
      endpoint = endpoint.replace(':guild_id', this.guildId);
    }
    endpoint = endpoint.replace(':command_id', commandId);
    await this.api.delete(endpoint);
  }
}
