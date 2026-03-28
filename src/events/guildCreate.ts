import { Events, Guild, TextChannel } from "discord.js";
import { Embed } from "../lib/embed";
import { logger } from "../lib/logger";

export default {
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    logger.info(`[Guild] Joined: ${guild.name} (${guild.id}) — ${guild.memberCount} members`);

    // Notify dashboard
    const dashboardUrl = process.env.DASHBOARD_URL;
    const secret = process.env.BOT_WEBHOOK_SECRET;
    if (dashboardUrl && secret) {
      await fetch(`${dashboardUrl}/api/bot/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({ action: "join", guildId: guild.id, guildName: guild.name, guildIcon: guild.icon }),
      }).catch(() => {});
    }

    // Send welcome message to system channel or first available channel
    const channel = guild.systemChannel || guild.channels.cache.find(
      (c) => c.isTextBased() && c.permissionsFor(guild.members.me!)?.has("SendMessages")
    ) as TextChannel | undefined;

    if (channel) {
      await channel.send({
        embeds: [Embed.success(
          "Hallo! Ich bin BotForge 🤖",
          `Danke für das Hinzufügen zu **${guild.name}**!\n\nIch bin der ultimative All-in-One Discord Bot. Nutze \`/help\` um alle Befehle zu sehen.\n\nKonfiguriere mich im Dashboard: ${process.env.DASHBOARD_URL}`,
          [
            { name: "🛡️ Auto-Mod", value: "KI-gestützte Moderation", inline: true },
            { name: "🎵 Musik", value: "Premium Audio Streaming", inline: true },
            { name: "📊 Statistiken", value: "Detaillierte Server-Analysen", inline: true },
          ]
        )],
      }).catch(() => {});
    }
  },
};
