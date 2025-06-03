import type { APIApplicationCommand } from 'discord-api-types/v10';

export type SlashCommandResourceProps = Pick<APIApplicationCommand, 'name' | 'description' | 'options'>;
