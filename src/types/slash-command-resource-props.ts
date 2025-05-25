import type { APIApplicationCommandOption } from 'discord-api-types/v10';

export interface SlashCommandResourceProps {
  name: string;
  description: string;
  options?: APIApplicationCommandOption[];
}
