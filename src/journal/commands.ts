import type { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord-api-types/v10';

export const journalCommand: RESTPostAPIChatInputApplicationCommandsJSONBody = {
  name: 'journal',
  type: ApplicationCommandType.ChatInput,
  description: "Manage Meido's journal subscriptions",
  options: [
    {
      name: 'info',
      description: 'Meido-chan, are you sending us updates?',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'subscribe',
      description: 'Meido-chan, please send us updates!',
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: 'unsubscribe',
      description: 'Meido-chan, please stop sending us updates.',
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],
};
