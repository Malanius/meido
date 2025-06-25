import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { getSubscriptionEntry } from '../subscription.db';
import { journalMessages } from './messages';

export const getSubscriptionInfo = async (command: APIChatInputApplicationCommandInteraction): Promise<string> => {
  let type: 'guild' | 'user';
  if (command.guild_id) {
    type = 'guild';
  } else if (command.user) {
    type = 'user';
  } else {
    return journalMessages.unknownContext;
  }

  // biome-ignore lint/style/noNonNullAssertion: we will have one of these or fail above
  const subscription = await getSubscriptionEntry(type, command.guild_id ?? command.user!.id);
  if (!subscription) {
    return journalMessages.info.notSubscribed[type];
  }

  if (type === 'guild') {
    return journalMessages.info.subscribed.guild(
      // biome-ignore lint/style/noNonNullAssertion: channel_id is guaranteed to be set when type is guild
      subscription.channel_id!,
      subscription.subscribed_at,
      // biome-ignore lint/style/noNonNullAssertion: subscribed_by is guaranteed to be set when type is guild and we have one of these or fail above
      subscription.subscribed_by!
    );
  }

  return journalMessages.info.subscribed.user;
};
