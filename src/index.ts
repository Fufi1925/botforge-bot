import { Client, GatewayIntentBits } from 'discord.js';
import { DisTube } from 'distube';
import { YouTubePlugin } from '@distube/youtube';
import * as dotenv from 'dotenv';

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

// WICHTIG: leaveOnEmpty wurde gelöscht, damit es nicht mehr abstürzt!
const distube = new DisTube(client, {
  plugins: [new YouTubePlugin()],
  emitNewSongOnly: true,
});

client.once('ready', () => {
  console.log(`✅ Bot ist online als ${client.user?.tag}`);
});

// Slash Befehle Registrierung
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  await interaction.reply({ content: "Bot reagiert! System läuft.", ephemeral: true });
});

client.login(process.env.DISCORD_BOT_TOKEN);
