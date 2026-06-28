export const journalMessages = {
  unknownContext: "Sumimasen! 🙇‍♀️ I don't know where this command came from. 😕",

  info: {
    subscribed: {
      guild: (channelId: string, subscribedAt: number, subscribedBy: string) =>
        `This server is subscribed to journal updates in <#${channelId}>. 🎉\n\
This subscription was done by <@${subscribedBy}> <t:${Math.floor(subscribedAt / 1000)}:R>.
Only Master-sama may change or cancel this subscription. 💌`,

      user:
        'You are already subscribed to journal updates. 🎉\n' +
        'If you no longer want to receive updates, use the `/journal unsubscribe` command. 🥺',
    },
    notSubscribed: {
      guild:
        'This server is not currently subscribed to journal updates. 🕊️\n' +
        'Only Master-sama may subscribe a channel using `/journal subscribe`. 💌`',

      user:
        'You are not currently subscribed to journal updates. 🕊️\n' +
        "If you'd like to receive my improvement journal directly, please run the `/journal subscribe` command here. 💌",
    },
  },

  subscribe: {
    restricted: `Sumimasen… 🙇‍♀️ This command is reserved for my Master-sama only. 💖
I cannot subscribe this server to journal updates without Master's permission.`,
    subscribed: {
      guild: (channelId: string) =>
        `This server is now subscribed to journal updates in <#${channelId}>. 🎉\n\
I will send a message in the channel when a new entry is published. 😊\n\
Only Master-sama may change or cancel this subscription. 💌`,

      user:
        'You are now subscribed to journal updates. 🎉\n' +
        'I will send you a DM whenever a new entry is published. 😊\n' +
        'You can unsubscribe at any time using the `/journal unsubscribe` command. 🥺',
    },
    alreadySubscribed: {
      guild:
        'This server is already subscribed to journal updates. 🎉\n' +
        'Only Master-sama may change or cancel this subscription. 💌',

      user:
        'You are already subscribed to journal updates. 🎉\n' +
        'If you no longer want to receive updates, use the `/journal unsubscribe` command. 🥺',
    },
  },

  unsubscribe: {
    restricted: `Gomen nasai… 🙇‍♀️ Only my Master-sama may decide when to stop receiving my journal updates here. 💖
I cannot unsubscribe this server without Master's command.`,
    guild:
      'This server has been unsubscribed from journal updates. 📪\n' +
      'To subscribe again in a different channel, use the `/journal subscribe` command there. 💌',

    user:
      'You are no longer subscribed to journal updates. 📪\n' +
      "If you'd like to hear from me again, just run `/journal subscribe` here anytime. 💖",

    notSubscribed: {
      guild:
        "This server isn't currently subscribed to journal updates. 🫧\n" +
        'You can start receiving updates by using the `/journal subscribe` command in a channel of your choice. ✨',

      user:
        'You are not currently subscribed to journal updates. 🫧\n' +
        "If you'd like to stay informed when I learn something new, run `/journal subscribe` here. 💕",
    },
  },
};
