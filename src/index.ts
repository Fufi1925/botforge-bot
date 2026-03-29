import { Client, GatewayIntentBits } from 'discord.js';
import { DisTube } from 'distube';
import { config } from 'dotenv';

config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

// Musik-Teil ganz einfach ohne Plugins für den ersten Start
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  leaveOnEmpty: true,
});

client.once('ready', () => {
  console.log(`✅ BotForge ist online als ${client.user?.tag}`);
});

// Fehler abfangen, damit der Bot nicht abstürzt
process.on('unhandledRejection', error => {
  console.error('Ein Fehler ist aufgetreten:', error);
});

client.login(process.env.DISCORD_TOKEN);
