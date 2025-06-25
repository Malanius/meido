import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { getSubscriptionEntry } from '../subscription.db';
import { journalMessages } from './messages';

export const getSubscriptionInfo = async (command: APIChatInputApplicationCommandInteraction): Promise<string> => {
  if (command.guild_id) {
    return await getGuildSubscription(command.guild_id);
  }
  if (command.user) {
    return await getUserSubscription(command.user.id);
  }

  return journalMessages.unknownContext;
};

const getGuildSubscription = async (guildId: string) => {
  const subscription = await getSubscriptionEntry('guild', guildId);
  if (!subscription) {
    return journalMessages.info.notSubscribedGuild;
  }

  // biome-ignore lint/style/noNonNullAssertion: channel_id, subscribed_by is guaranteed to be set when type is guild
  return journalMessages.info.guild(subscription.channel_id!, subscription.subscribed_at, subscription.subscribed_by!);
};

const getUserSubscription = async (userId: string) => {
  const subscription = await getSubscriptionEntry('user', userId);
  if (!subscription) {
    return journalMessages.info.notSubscribedDM;
  }

  return journalMessages.info.dm;
};
