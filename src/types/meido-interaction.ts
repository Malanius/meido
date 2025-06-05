import type { APIApplicationCommandInteraction } from 'discord-api-types/v10';

export interface MeidoInteraction {
  invokedByMaster: boolean;
  endpointColdStart: boolean;
  command: APIApplicationCommandInteraction;
}
