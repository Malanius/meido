import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { type SubscriptionEntry, createSubscriptionEntry, getSubscriptionEntry } from '../subscription.db';
import { journalMessages } from './messages';

export const subscribe = async (command: APIChatInputApplicationCommandInteraction) => {
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
  if (subscription) {
    return journalMessages.subscribe.alreadySubscribed[type];
  }

  const newSubscription: SubscriptionEntry = {
    pk: 'journal#subscription',
    sk: `${type}#${command.guild_id ?? command.user?.id}`,
    channel_id: command.channel?.id,
    subscribed_by: command.member?.user.id,
    subscribed_at: Date.now(),
  };

  await createSubscriptionEntry(newSubscription);

  if (type === 'guild') {
    // biome-ignore lint/style/noNonNullAssertion: channel_id is guaranteed to be set when type is guild
    return journalMessages.subscribe.subscribed.guild(newSubscription.channel_id!);
  }

  return journalMessages.subscribe.subscribed.user;
};
