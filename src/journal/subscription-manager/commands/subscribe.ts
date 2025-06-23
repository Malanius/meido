import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { type SubscriptionEntry, createSubscriptionEntry, getSubscriptionEntry } from '../subscription.db';

export const subscribe = async (command: APIChatInputApplicationCommandInteraction) => {
  let type: 'guild' | 'user';
  if (command.guild_id) {
    type = 'guild';
  } else if (command.user) {
    type = 'user';
  } else {
    return "Sumimasen! :woman_bowing: I don't know where this command came from. :confused:";
  }

  // biome-ignore lint/style/noNonNullAssertion: we will have one of these or fail above
  const subscription = await getSubscriptionEntry(type, command.guild_id ?? command.user!.id);
  if (subscription) {
    if (type === 'guild') {
      return `This server is already subscribed to journal updates in <#${subscription.channel_id}>. :tada:\n\
If you need to change the channel or no longer want to receive updates, use the \`/journal unsubscribe\` command. :pleading_face:`;
    }

    return 'You are already subscribed to journal updates. :tada:\n\
If you no longer want to receive updates, use the `/journal unsubscribe` command. :pleading_face:';
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
    return `This server is now subscribed to journal updates in <#${newSubscription.channel_id}>. :tada:\n\
I will send a message in the channel when a new entry is published. :blush:\n\
You can unsubscribe at any time using the \`/journal unsubscribe\` command. :pleading_face:`;
  }

  return 'You are now subscribed to journal updates. :tada:\n\
  I will send you a DM when a new entry is published. :blush:\n\
  You can unsubscribe at any time using the `/journal unsubscribe` command. :pleading_face:';
};
