// ╔══════════════════════════════════════════════════════════════════╗
// ║                  BotForge — Main Entry Point                     ║
// ╚══════════════════════════════════════════════════════════════════╝
import "dotenv/config";
import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  ActivityType,
} from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { DisTube } from "distube";
import { SoundCloudPlugin } from "@distube/soundcloud";
import { SpotifyPlugin } from "@distube/spotify";
import { BotClient, Command } from "./types";
import { AutoModManager } from "./managers/AutoModManager";
import { LogManager } from "./managers/LogManager";
import { EconomyManager } from "./managers/EconomyManager";
import { StatsManager } from "./managers/StatsManager";
import { logger } from "./lib/logger";

// ─────────────────────────────────────────────
// Create Discord Client with all required intents
// ─────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
}) as BotClient;

// Attach collections
client.commands = new Collection<string, Command>();
client.cooldowns = new Collection<string, Collection<string, number>>();

// ─────────────────────────────────────────────
// DisTube (Music) Setup
// ─────────────────────────────────────────────
client.distube = new DisTube(client, {
  plugins: [
    new SoundCloudPlugin(),
    new SpotifyPlugin({
      parallel: true,
      emitEventsAfterFetching: true,
    }),
  ],
  emitNewSongOnly: false,
  leaveOnEmpty: true,
  leaveOnEmptyCooldown: 30_000,
  leaveOnFinish: false,
  leaveOnFinishCooldown: 10_000,
  nsfw: false,
  savePreviousSongs: true,
});

// ─────────────────────────────────────────────
// Load Commands
// ─────────────────────────────────────────────
async function loadCommands() {
  const commandsPath = join(__dirname, "commands");
  const categoryFolders = readdirSync(commandsPath);

  for (const folder of categoryFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

    for (const file of commandFiles) {
      const { default: command }: { default: Command } = await import(join(folderPath, file));
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        logger.info(`[Commands] Loaded: /${command.data.name}`);
      }
    }
  }
}

// ─────────────────────────────────────────────
// Load Events
// ─────────────────────────────────────────────
async function loadEvents() {
  const eventsPath = join(__dirname, "events");
  const eventFiles = readdirSync(eventsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of eventFiles) {
    const { default: event } = await import(join(eventsPath, file));
    if (event?.name) {
      if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
      else client.on(event.name, (...args) => event.execute(...args, client));
      logger.info(`[Events] Registered: ${event.name}`);
    }
  }
}

// ─────────────────────────────────────────────
// Initialize Managers (attaches them to client events)
// ─────────────────────────────────────────────
async function initManagers() {
  AutoModManager.init(client);
  LogManager.init(client);
  EconomyManager.init(client);
  StatsManager.init(client);
  logger.info("[Managers] All managers initialized.");
}

// ─────────────────────────────────────────────
// Main startup function
// ─────────────────────────────────────────────
async function main() {
  logger.info("[BotForge] Starting up…");
  await loadCommands();
  await loadEvents();
  await initManagers();

  client.once("ready", () => {
    logger.info(`[BotForge] Logged in as ${client.user?.tag}`);
    client.user?.setPresence({
      activities: [{ name: "/help | BotForge", type: ActivityType.Watching }],
      status: "online",
    });

    // Notify dashboard webhook of joined guilds on startup
    notifyDashboardGuilds();
  });

  await client.login(process.env.DISCORD_BOT_TOKEN);
}

async function notifyDashboardGuilds() {
  const dashboardUrl = process.env.DASHBOARD_URL;
  const secret = process.env.BOT_WEBHOOK_SECRET;
  if (!dashboardUrl || !secret || !client.guilds.cache.size) return;

  for (const [, guild] of client.guilds.cache) {
    await fetch(`${dashboardUrl}/api/bot/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-bot-secret": secret },
      body: JSON.stringify({
        action: "join",
        guildId: guild.id,
        guildName: guild.name,
        guildIcon: guild.icon,
      }),
    }).catch(() => {});
  }
}

main().catch((err) => {
  logger.error("[BotForge] Fatal startup error:", err);
  process.exit(1);
});
