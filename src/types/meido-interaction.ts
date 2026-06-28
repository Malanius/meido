import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';

export interface MeidoInteraction {
  invokedByMaster: boolean;
  endpointColdStart: boolean;
  command: APIChatInputApplicationCommandInteraction;
}
