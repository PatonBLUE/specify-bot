require('dotenv').config();
const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const protectedChannels = new Set();

// Anti-crash logging
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));
process.on('uncaughtException', (error) => console.error('Uncaught Exception:', error));

client.once(Events.ClientReady, async () => {
  console.log(`Specify is online! Protecting ${protectedChannels.size} channels.`);
  try {
    const commands = [{ name: 'clean-channel', description: 'Toggle clean mode for this channel' }];
    const rest = new REST().setToken(process.env.TOKEN);
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('Commands synced');
  } catch (error) {
    console.error('Command sync failed (non-fatal):', error);
  }
});

client.on(Events.InteractionCreate, async i => {
  if (!i.isChatInputCommand() || i.commandName !== 'clean-channel') return;
  const ch = i.channelId;
  if (protectedChannels.has(ch)) {
    protectedChannels.delete(ch);
    await i.reply('Clean mode disabled');
  } else {
    protectedChannels.add(ch);
    await i.reply('Clean mode enabled – normal messages will be deleted');
  }
});

client.on(Events.MessageCreate, async msg => {
  if (!protectedChannels.has(msg.channel.id) || msg.author.bot || msg.type === 20 || msg.interaction) return;
  try { await msg.delete(); } catch(e) { console.error('Delete failed:', e); }
});

client.login(process.env.TOKEN).catch(error => {
  console.error('Login failed:', error);
});
