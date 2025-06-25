export const journalMessages = {
  unknownContext: "Sumimasen! 🙇‍♀️ I don't know where this command came from. 😕",

  info: {
    guild: (channelId: string, subscribedAt: number, subscribedBy: string) =>
      `This server is already subscribed to journal updates in <#${channelId}>. 🎉\n\
This subscription was done by <@${subscribedBy}> <t:${Math.floor(subscribedAt / 1000)}:R>.
If you need to change the channel or no longer want to receive updates, use the \`/journal unsubscribe\` command. 🥺`,

    dm:
      'You are already subscribed to journal updates. 🎉\n' +
      'If you no longer want to receive updates, use the `/journal unsubscribe` command. 🥺',

    notSubscribedGuild:
      'This server is not currently subscribed to journal updates. 🕊️\n' +
      `To begin receiving my improvement journal, use the \`/journal subscribe\` command in the channel you'd like updates sent to. 💌`,

    notSubscribedDM:
      'You are not currently subscribed to journal updates. 🕊️\n' +
      "If you'd like to receive my improvement journal directly, please run the `/journal subscribe` command here. 💌",
  },

  subscribe: {
    guild: (channelId: string) =>
      `This server is now subscribed to journal updates in <#${channelId}>. 🎉\n\
I will send a message in the channel when a new entry is published. 😊\n\
You can unsubscribe at any time using the \`/journal unsubscribe\` command. 🥺`,

    dm:
      'You are now subscribed to journal updates. 🎉\n' +
      'I will send you a DM whenever a new entry is published. 😊\n' +
      'You can unsubscribe at any time using the `/journal unsubscribe` command. 🥺',
  },

  unsubscribe: {
    guild:
      'This server has been unsubscribed from journal updates. 📪\n' +
      'To subscribe again in a different channel, use the `/journal subscribe` command there. 💌',

    dm:
      'You are no longer subscribed to journal updates. 📪\n' +
      "If you'd like to hear from me again, just run `/journal subscribe` here anytime. 💖",

    notSubscribedGuild:
      "This server isn't currently subscribed to journal updates. 🫧\n" +
      'You can start receiving updates by using the `/journal subscribe` command in a channel of your choice. ✨',

    notSubscribedDM:
      'You are not currently subscribed to journal updates. 🫧\n' +
      "If you'd like to stay informed when I learn something new, run `/journal subscribe` here. 💕",
  },
};
