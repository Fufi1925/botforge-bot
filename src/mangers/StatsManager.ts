// ╔══════════════════════════════════════════════════════════════════╗
// ║              BotForge StatsManager                               ║
// ║  Collect and aggregate server statistics                         ║
// ╚══════════════════════════════════════════════════════════════════╝
import { Client, Message } from "discord.js";
import { logger } from "../lib/logger";
import cron from "node-cron";

interface GuildStats {
  messageCount: number;
  activeUsers: Set<string>;
  voiceMinutes: number;
  channelActivity: Map<string, number>;
  topEmojis: Map<string, number>;
}

const dailyStats = new Map<string, GuildStats>(); // guildId -> stats

function getGuildStats(guildId: string): GuildStats {
  if (!dailyStats.has(guildId)) {
    dailyStats.set(guildId, {
      messageCount: 0,
      activeUsers: new Set(),
      voiceMinutes: 0,
      channelActivity: new Map(),
      topEmojis: new Map(),
    });
  }
  return dailyStats.get(guildId)!;
}

export class StatsManager {
  static init(client: Client): void {
    // Track messages
    client.on("messageCreate", (message) => {
      if (!message.guild || message.author.bot) return;
      const stats = getGuildStats(message.guild.id);
      stats.messageCount++;
      stats.activeUsers.add(message.author.id);

      // Track channel activity
      const chCount = stats.channelActivity.get(message.channelId) ?? 0;
      stats.channelActivity.set(message.channelId, chCount + 1);

      // Track emoji usage
      const emojiRegex = /<a?:\w+:\d+>|[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
      const emojis = message.content.match(emojiRegex) ?? [];
      for (const emoji of emojis) {
        const count = stats.topEmojis.get(emoji) ?? 0;
        stats.topEmojis.set(emoji, count + 1);
      }
    });

    // Track voice minutes (checked every minute)
    setInterval(() => {
      for (const [guildId, guild] of client.guilds.cache) {
        const voiceMembers = guild.voiceStates.cache.filter(
          (vs) => vs.channelId && !vs.member?.user.bot
        ).size;
        const stats = getGuildStats(guildId);
        stats.voiceMinutes += voiceMembers;
      }
    }, 60_000);

    // Daily stats reset & push to dashboard (via HTTP)
    cron.schedule("0 0 * * *", async () => {
      await this.pushDailyStats(client);
      dailyStats.clear();
      logger.info("[Stats] Daily stats pushed and reset.");
    }, { timezone: "Europe/Berlin" });

    logger.info("[Stats] StatsManager initialized.");
  }

  static getStats(guildId: string): GuildStats {
    return getGuildStats(guildId);
  }

  static getTopChannels(guildId: string, limit = 5): Array<{ channelId: string; count: number }> {
    const stats = getGuildStats(guildId);
    return [...stats.channelActivity.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([channelId, count]) => ({ channelId, count }));
  }

  static getTopEmojis(guildId: string, limit = 10): Array<{ emoji: string; count: number }> {
    const stats = getGuildStats(guildId);
    return [...stats.topEmojis.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([emoji, count]) => ({ emoji, count }));
  }

  private static async pushDailyStats(client: Client): Promise<void> {
    const dashboardUrl = process.env.DASHBOARD_URL;
    const secret = process.env.BOT_WEBHOOK_SECRET;
    if (!dashboardUrl || !secret) return;

    for (const [guildId, stats] of dailyStats) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      await fetch(`${dashboardUrl}/api/guilds/${guildId}/stats`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-bot-secret": secret },
        body: JSON.stringify({
          memberCount: guild.memberCount,
          messageCount: stats.messageCount,
          activeUsers: stats.activeUsers.size,
          voiceMinutes: stats.voiceMinutes,
        }),
      }).catch(() => {});
    }
  }
}
