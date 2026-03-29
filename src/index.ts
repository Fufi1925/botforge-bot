import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { DisTube } from 'distube';
import { YouTubePlugin } from '@distube/youtube';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { SpotifyPlugin } from '@distube/spotify';
import * as dotenv from 'dotenv';
import { Logger } from './lib/logger';
import { EmbedBuilder } from './lib/embed';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
});

// Musik-Player Initialisierung (KORRIGIERT)
const distube = new DisTube(client, {
  plugins: [
    new YouTubePlugin(),
    new SoundCloudPlugin(),
    new SpotifyPlugin(),
  ],
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
});

client.once('ready', () => {
  Logger.info(`Eingeloggt als ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  // Befehls-Logik hier...
  Logger.info(`Befehl ausgeführt: ${interaction.commandName}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);

export { client, distube };
