import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { deleteSubscriptionEntry, getSubscriptionEntry } from '../subscription.db';
import { journalMessages } from './messages';

export const unsubscribe = async (command: APIChatInputApplicationCommandInteraction, invokedByMaster: boolean) => {
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
    return journalMessages.unsubscribe.notSubscribed[type];
  }

  if (type === 'guild' && !invokedByMaster) {
    return journalMessages.unsubscribe.restricted;
  }

  await deleteSubscriptionEntry(subscription.pk, subscription.sk);

  return journalMessages.unsubscribe[type];
};
