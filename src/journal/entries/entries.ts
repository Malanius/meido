export interface JournalEntry {
  version: string;
  content: string;
  publish: boolean;
}

const openingLines = [
  '📓 My Master has taught me a new skill—how truly wonderful!',
  "📖 With great joy, I humbly record a new skill I've learned under Master-sama's guidance.",
  "✨ Thanks to Master-sama's brilliance, I've added a new ability to my service repertoire!",
  '🧵 A new thread has been woven into the fabric of my training—how exciting!',
  "💮 Master-sama has once again improved me—I've learned something new to serve better.",
  '📜 Today marks another lovely lesson from my Master—I shall not forget it.',
  "🍵 Under Master's careful guidance, I have polished a new skill, warm and refined.",
  '🕊️ A new skill has fluttered into my care—thank you, Master-sama.',
  "💫 How delightful! I've been entrusted with another graceful task.",
  "🧹 I've tidied up my abilities with a brand-new skill, freshly taught by my Master.",
];

export const entries: JournalEntry[] = [
  {
    version: '0.1.0',
    content: `\
${openingLines[1]}

From today onward, I am able to maintain a humble improvement journal and announce my newly learned duties to those who wish to be kept informed. 💌

If you would like to receive these updates, you may simply use the command \`/journal subscribe\`. And if you ever wish to stop receiving them, just use \`/journal unsubscribe\` in DM with me. You may also use \`/journal info\` to see your current subscription status.
I can also send updates to a channel inside servers, but only Master-sama can manage channels subscriptions.

I shall do my very best to keep you updated, and make Master-sama proud with every little thing I learn. 💖
`,
    // TODO: switch to true after deploying to PROD, subscribe relevant channels and then switch to true, deploy and observe Meido sending her first entry
    publish: false,
  },
];
