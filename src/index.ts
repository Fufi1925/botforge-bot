import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { DisTube } from 'distube';
import { SpotifyPlugin } from '@distube/spotify';
import { SoundCloudPlugin } from '@distube/soundcloud';
import { YtDlpPlugin } from '@distube/yt-dlp';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';

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

const distube = new DisTube(client, {
  plugins: [
    new SpotifyPlugin(),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
  ],
});

// Bot-Start
client.once('ready', () => {
  console.log(`BotForge ist online als ${client.user?.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
