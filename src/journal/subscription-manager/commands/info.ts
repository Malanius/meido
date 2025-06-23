import type { APIChatInputApplicationCommandInteraction } from 'discord-api-types/v10';
import { getSubscriptionEntry } from '../subscription.db';

export const getSubscriptionInfo = async (command: APIChatInputApplicationCommandInteraction): Promise<string> => {
  if (command.guild_id) {
    return await getGuildSubscription(command.guild_id);
  }
  if (command.user) {
    return await getUserSubscription(command.user.id);
  }

  return "Sumimasen! :woman_bowing: I don't know where this command came from?! :confused:";
};

const getGuildSubscription = async (guildId: string) => {
  const subscription = await getSubscriptionEntry('guild', guildId);
  if (!subscription) {
    return `Your server is not subscribed to journal updates in any channel. :frowning:
To subscribe, use the \`/journal subscribe\` command in the channel you want to receive updates. :pray:`;
  }

  return `Your server is subscribed to journal updates in the following channel: <#${subscription.channel_id}>.
This subscription was done by <@${subscription.subscribed_by}> <t:${Math.floor(subscription.subscribed_at / 1000)}:R>.
I will send a message in the channel when a new entry is published. :blush:
You can unsubscribe at any time using the \`/journal unsubscribe\` command. :pleading_face:`;
};

const getUserSubscription = async (userId: string) => {
  const subscription = await getSubscriptionEntry('user', userId);
  if (!subscription) {
    return `You are not subscribed to journal updates.
To subscribe, use the \`/journal subscribe\` command.`;
  }

  return `You are subscribed to journal updates since <t:${Math.floor(subscription.subscribed_at / 1000)}:R>.
I will send you a DM when a new entry is published. :blush:
You can unsubscribe at any time using the \`/journal unsubscribe\` command. :pleading_face:`;
};
