require('dotenv').config();
const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');
const express = require('express');
const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const protectedChannels = new Set();

client.once(Events.ClientReady, async () => {
  console.log(`Specify is online! Protecting ${protectedChannels.size} channels.`);

  // BULLET-PROOF: Bulk-overwrite global commands (deletes old ones automatically)
  const commands = [
    {
      name: 'clean-channel',
      description: 'Toggle clean mode for this channel (deletes normal messages)',
    }
  ];

  const rest = new REST().setToken(process.env.TOKEN);
  try {
    console.log('🔄 Syncing commands...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log('✅ Commands synced! Old one deleted, only /clean-channel remains.');
  } catch (error) {
    console.error('Command sync failed:', error);
  }

  // Replit pinger (remove these 4 lines if on Railway)
  app.get('/keepalive', (req, res) => res.send('Bot alive!'));
  app.listen(3000, () => console.log('Web server running'));
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'clean-channel') {
    const ch = interaction.channelId;
    if (protectedChannels.has(ch)) {
      protectedChannels.delete(ch);
      await interaction.reply({ content: '❌ Clean mode **disabled** for this channel.', ephemeral: false });
    } else {
      protectedChannels.add(ch);
      await interaction.reply({ content: '✅ Clean mode **enabled**! Normal messages will be deleted.\nSlash commands still work.', ephemeral: false });
    }
  }
});

client.on(Events.MessageCreate, async message => {
  // Remove !forcesync since we don't need it anymore
  if (!protectedChannels.has(message.channel.id)) return;
  if (message.author.bot) return;
  if (message.type === 20 || message.interaction) return;
  try { await message.delete(); } catch(e) {}
});

client.login(process.env.TOKEN);