// ╔══════════════════════════════════════════════════════════════════╗
// ║              BotForge EconomyManager                             ║
// ║  Coins, XP, Levels, Daily, Work, Gambling                       ║
// ╚══════════════════════════════════════════════════════════════════╝
import { Client, Message, VoiceState } from "discord.js";
import { logger } from "../lib/logger";

// In-memory storage (replace with Prisma for persistence)
const economyData = new Map<string, {
  balance: number; xp: number; level: number;
  lastDaily?: number; lastWork?: number; lastMessage?: number;
}>();

const voiceJoinTimes = new Map<string, number>(); // userId -> joinTimestamp

// XP required to level up: 5 * lvl² + 50 * lvl + 100
function xpForLevel(level: number): number {
  return 5 * level * level + 50 * level + 100;
}

export class EconomyManager {
  private static XP_COOLDOWN_MS = 60_000;
  private static MESSAGE_XP_MIN = 5;
  private static MESSAGE_XP_MAX = 15;
  private static VOICE_XP_PER_MIN = 3;
  private static DAILY_AMOUNT = 100;
  private static WORK_MIN = 50;
  private static WORK_MAX = 200;

  static init(client: Client): void {
    client.on("messageCreate", (msg) => {
      if (!msg.guild || msg.author.bot) return;
      this.onMessage(msg as Message);
    });

    client.on("voiceStateUpdate", (oldState, newState) => {
      this.onVoiceUpdate(oldState, newState);
    });

    // Every minute: tick voice XP
    setInterval(() => this.tickVoiceXP(), 60_000);

    logger.info("[Economy] EconomyManager initialized.");
  }

  private static getUserKey(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  static getUser(guildId: string, userId: string) {
    const key = this.getUserKey(guildId, userId);
    if (!economyData.has(key)) {
      economyData.set(key, { balance: 0, xp: 0, level: 0 });
    }
    return economyData.get(key)!;
  }

  static addCoins(guildId: string, userId: string, amount: number): number {
    const user = this.getUser(guildId, userId);
    user.balance = Math.max(0, user.balance + amount);
    return user.balance;
  }

  static addXp(guildId: string, userId: string, amount: number): { leveled: boolean; newLevel: number } {
    const user = this.getUser(guildId, userId);
    user.xp += amount;
    let leveled = false;
    while (user.xp >= xpForLevel(user.level)) {
      user.xp -= xpForLevel(user.level);
      user.level++;
      leveled = true;
    }
    return { leveled, newLevel: user.level };
  }

  private static async onMessage(msg: Message): Promise<void> {
    const key = this.getUserKey(msg.guild!.id, msg.author.id);
    const user = this.getUser(msg.guild!.id, msg.author.id);
    const now = Date.now();

    // XP cooldown check
    if (user.lastMessage && now - user.lastMessage < this.XP_COOLDOWN_MS) return;

    user.lastMessage = now;
    const xpGain = Math.floor(Math.random() * (this.MESSAGE_XP_MAX - this.MESSAGE_XP_MIN + 1)) + this.MESSAGE_XP_MIN;
    const { leveled, newLevel } = this.addXp(msg.guild!.id, msg.author.id, xpGain);

    if (leveled) {
      // Import Embed here to avoid circular deps
      const { Embed } = await import("../lib/embed");
      msg.reply({ embeds: [Embed.success(`Level Up! 🎉`, `Glückwunsch ${msg.author}! Du bist auf **Level ${newLevel}** aufgestiegen!`)] }).catch(() => {});
    }
  }

  private static onVoiceUpdate(oldState: VoiceState, newState: VoiceState): void {
    const userId = newState.id || oldState.id;
    if (!userId) return;

    if (!oldState.channelId && newState.channelId) {
      // Joined voice
      voiceJoinTimes.set(`${newState.guild.id}:${userId}`, Date.now());
    } else if (oldState.channelId && !newState.channelId) {
      // Left voice
      voiceJoinTimes.delete(`${oldState.guild.id}:${userId}`);
    }
  }

  private static tickVoiceXP(): void {
    for (const [key] of voiceJoinTimes) {
      const [guildId, userId] = key.split(":");
      this.addXp(guildId, userId, this.VOICE_XP_PER_MIN);
      this.addCoins(guildId, userId, 1);
    }
  }

  static claimDaily(guildId: string, userId: string): { success: boolean; amount: number; nextClaim: number } {
    const user = this.getUser(guildId, userId);
    const now = Date.now();
    const DAY_MS = 86_400_000;
    if (user.lastDaily && now - user.lastDaily < DAY_MS) {
      return { success: false, amount: 0, nextClaim: user.lastDaily + DAY_MS };
    }
    user.lastDaily = now;
    const amount = this.DAILY_AMOUNT;
    this.addCoins(guildId, userId, amount);
    return { success: true, amount, nextClaim: now + DAY_MS };
  }

  static work(guildId: string, userId: string): { success: boolean; amount: number; nextWork: number } {
    const user = this.getUser(guildId, userId);
    const now = Date.now();
    const COOLDOWN_MS = 3_600_000; // 1 hour
    if (user.lastWork && now - user.lastWork < COOLDOWN_MS) {
      return { success: false, amount: 0, nextWork: user.lastWork + COOLDOWN_MS };
    }
    user.lastWork = now;
    const amount = Math.floor(Math.random() * (this.WORK_MAX - this.WORK_MIN + 1)) + this.WORK_MIN;
    this.addCoins(guildId, userId, amount);
    return { success: true, amount, nextWork: now + COOLDOWN_MS };
  }

  // Coinflip gambling
  static gambleCoinflip(guildId: string, userId: string, bet: number, choice: "heads" | "tails"): {
    won: boolean; amount: number; balance: number;
  } {
    const user = this.getUser(guildId, userId);
    if (bet > user.balance) throw new Error("Nicht genug Münzen.");
    if (bet <= 0) throw new Error("Der Einsatz muss positiv sein.");

    const result = Math.random() < 0.5 ? "heads" : "tails";
    const won = result === choice;
    this.addCoins(guildId, userId, won ? bet : -bet);
    return { won, amount: bet, balance: user.balance };
  }

  static getLeaderboard(guildId: string, type: "balance" | "xp" | "level" = "balance"): Array<{ userId: string; value: number }> {
    const guildUsers: Array<{ userId: string; value: number }> = [];
    for (const [key, data] of economyData) {
      if (key.startsWith(guildId + ":")) {
        const userId = key.split(":")[1];
        guildUsers.push({ userId, value: data[type === "balance" ? "balance" : type] });
      }
    }
    return guildUsers.sort((a, b) => b.value - a.value).slice(0, 10);
  }
}
