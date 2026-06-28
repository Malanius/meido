import { ApplicationCommandType, type RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

export const tadaimaCommand: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: 'tadaima',
  description: 'Greets you with a warm welcome!',
  type: ApplicationCommandType.ChatInput,
};
