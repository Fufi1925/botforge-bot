import { Events, Guild } from "discord.js";
import { logger } from "../lib/logger";

export default {
  name: Events.GuildDelete,
  async execute(guild: Guild) {
    logger.info(`[Guild] Left: ${guild.name} (${guild.id})`);
    const dashboardUrl = process.env.DASHBOARD_URL;
    const secret = process.env.BOT_WEBHOOK_SECRET;
    if (dashboardUrl && secret) {
      await fetch(`${dashboardUrl}/api/bot/webhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({ action: "leave", guildId: guild.id }),
      }).catch(() => {});
    }
  },
};
