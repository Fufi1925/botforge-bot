// ╔══════════════════════════════════════════════════════════════════╗
// ║              BotForge AutoModManager                             ║
// ║  Multi-stage filter + AI Toxicity (Google Perspective API)      ║
// ╚══════════════════════════════════════════════════════════════════╝
import {
  Client, Message, GuildMember, PermissionFlagsBits,
  TextChannel, Collection
} from "discord.js";
import { Embed } from "../lib/embed";
import { logger } from "../lib/logger";

// In-memory spam tracker: userId -> message timestamps
const spamTracker = new Map<string, number[]>();
// Warn points: guildId:userId -> points
const warnPoints = new Map<string, number>();

// ─────────────────────────────────────────────
// AutoMod Configuration (loaded from DB / env)
// ─────────────────────────────────────────────
interface AutoModConfig {
  filterHateSpeech: boolean;
  filterLinks: boolean;
  filterSpam: boolean;
  filterInvites: boolean;
  filterCaps: boolean;
  filterEmojis: boolean;
  aiToxicityEnabled: boolean;
  aiToxicityThreshold: number;
  spamMessageCount: number;
  spamTimeWindowSec: number;
  capsPercentage: number;
  maxEmojis: number;
  warnThreshold: number;
  muteThreshold: number;
  timeoutThreshold: number;
  kickThreshold: number;
  banThreshold: number;
  muteDurationMin: number;
  logChannelId?: string;
  exemptRoles: string[];
  exemptChannels: string[];
  customBadWords: string[];
}

// Default config (fallback when DB is unavailable)
const defaultConfig: AutoModConfig = {
  filterHateSpeech: true, filterLinks: true, filterSpam: true,
  filterInvites: true, filterCaps: true, filterEmojis: false,
  aiToxicityEnabled: false, aiToxicityThreshold: 0.7,
  spamMessageCount: 5, spamTimeWindowSec: 10, capsPercentage: 70, maxEmojis: 10,
  warnThreshold: 3, muteThreshold: 5, timeoutThreshold: 7,
  kickThreshold: 10, banThreshold: 15, muteDurationMin: 10,
  exemptRoles: [], exemptChannels: [], customBadWords: [],
};

// ─────────────────────────────────────────────
// Regex patterns
// ─────────────────────────────────────────────
const LINK_REGEX = /https?:\/\/[^\s]+/gi;
const INVITE_REGEX = /discord(?:\.gg|\.com\/invite)\/[a-zA-Z0-9-]+/gi;
const EMOJI_REGEX = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;

const HATE_SPEECH_WORDS = [
  // Basic filter list (extend as needed)
  "slur1", "slur2", "badword1",
];

export class AutoModManager {
  private static guildConfigs = new Map<string, AutoModConfig>();

  static init(client: Client): void {
    client.on("messageCreate", (message) => this.onMessage(message as Message));
    logger.info("[AutoMod] AutoModManager initialized.");
  }

  static setConfig(guildId: string, config: Partial<AutoModConfig>): void {
    this.guildConfigs.set(guildId, { ...defaultConfig, ...config });
  }

  private static getConfig(guildId: string): AutoModConfig {
    return this.guildConfigs.get(guildId) ?? defaultConfig;
  }

  // ─────────────────────────────────────────────
  // Main message handler
  // ─────────────────────────────────────────────
  private static async onMessage(message: Message): Promise<void> {
    if (!message.guild || message.author.bot) return;
    const config = this.getConfig(message.guild.id);

    // Skip exempt channels/roles
    if (config.exemptChannels.includes(message.channelId)) return;
    const member = message.member;
    if (!member) return;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return;
    if (config.exemptRoles.some((r) => member.roles.cache.has(r))) return;

    let violated = false;
    let reason = "";

    // 1. Hate speech / bad words filter
    if (config.filterHateSpeech) {
      const lower = message.content.toLowerCase();
      const found = [...HATE_SPEECH_WORDS, ...config.customBadWords].find((w) => lower.includes(w));
      if (found) { violated = true; reason = `Verbotenes Wort erkannt`; }
    }

    // 2. Link filter
    if (!violated && config.filterLinks && LINK_REGEX.test(message.content)) {
      if (!config.filterInvites) {
        violated = true; reason = "Nicht erlaubter Link";
      }
    }
    LINK_REGEX.lastIndex = 0;

    // 3. Invite filter
    if (!violated && config.filterInvites && INVITE_REGEX.test(message.content)) {
      violated = true; reason = "Discord-Einladungslink nicht erlaubt";
    }
    INVITE_REGEX.lastIndex = 0;

    // 4. Spam filter
    if (!violated && config.filterSpam) {
      const key = `${message.guild.id}:${message.author.id}`;
      const now = Date.now();
      const timestamps = spamTracker.get(key) ?? [];
      const windowMs = config.spamTimeWindowSec * 1000;
      const recent = timestamps.filter((t) => now - t < windowMs);
      recent.push(now);
      spamTracker.set(key, recent);
      if (recent.length >= config.spamMessageCount) {
        violated = true; reason = `Spam (${recent.length} Nachrichten in ${config.spamTimeWindowSec}s)`;
      }
    }

    // 5. Caps filter
    if (!violated && config.filterCaps && message.content.length > 10) {
      const upper = message.content.replace(/[^a-zA-Z]/g, "").split("").filter((c) => c === c.toUpperCase()).length;
      const total = message.content.replace(/[^a-zA-Z]/g, "").length;
      if (total > 0 && (upper / total) * 100 > config.capsPercentage) {
        violated = true; reason = `Zu viele Großbuchstaben (${Math.round((upper / total) * 100)}%)`;
      }
    }

    // 6. Emoji spam filter
    if (!violated && config.filterEmojis) {
      const emojiMatches = message.content.match(EMOJI_REGEX) ?? [];
      if (emojiMatches.length > config.maxEmojis) {
        violated = true; reason = `Zu viele Emojis (${emojiMatches.length}/${config.maxEmojis})`;
      }
    }

    // 7. AI Toxicity check (Google Perspective API)
    if (!violated && config.aiToxicityEnabled && process.env.PERSPECTIVE_API_KEY) {
      const toxicity = await this.checkToxicity(message.content);
      if (toxicity !== null && toxicity > config.aiToxicityThreshold) {
        violated = true; reason = `KI-Toxizitätsprüfung (Score: ${toxicity.toFixed(2)})`;
      }
    }

    if (violated) {
      await this.handleViolation(message, member, reason, config);
    }
  }

  // ─────────────────────────────────────────────
  // Google Perspective API call
  // ─────────────────────────────────────────────
  private static async checkToxicity(text: string): Promise<number | null> {
    try {
      const apiKey = process.env.PERSPECTIVE_API_KEY;
      const res = await fetch(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comment: { text },
            languages: ["de", "en"],
            requestedAttributes: { TOXICITY: {} },
          }),
        }
      );
      const data = await res.json();
      return data.attributeScores?.TOXICITY?.summaryScore?.value ?? null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // Handle violation: delete message, add warn point, apply punishment
  // ─────────────────────────────────────────────
  private static async handleViolation(
    message: Message,
    member: GuildMember,
    reason: string,
    config: AutoModConfig
  ): Promise<void> {
    // Delete the offending message
    await message.delete().catch(() => {});

    // Increment warn points
    const key = `${message.guild!.id}:${message.author.id}`;
    const currentPoints = (warnPoints.get(key) ?? 0) + 1;
    warnPoints.set(key, currentPoints);

    // DM the user
    const dmEmbed = Embed.warning(
      "AutoMod-Aktion",
      `Deine Nachricht auf **${message.guild!.name}** wurde entfernt.\n**Grund:** ${reason}\n**Warnpunkte:** ${currentPoints}`
    );
    await message.author.send({ embeds: [dmEmbed] }).catch(() => {});

    // Apply punishment based on point thresholds
    let action = "warn";
    if (currentPoints >= config.banThreshold) {
      action = "ban";
      await member.ban({ reason: `[AutoMod] ${reason}` }).catch(() => {});
    } else if (currentPoints >= config.kickThreshold) {
      action = "kick";
      await member.kick(`[AutoMod] ${reason}`).catch(() => {});
    } else if (currentPoints >= config.timeoutThreshold) {
      action = "timeout";
      await member.timeout(config.muteDurationMin * 60 * 1000, `[AutoMod] ${reason}`).catch(() => {});
    } else if (currentPoints >= config.muteThreshold) {
      action = "timeout";
      await member.timeout(config.muteDurationMin * 60 * 1000 / 2, `[AutoMod] ${reason}`).catch(() => {});
    }

    // Log to configured channel
    if (config.logChannelId) {
      const logChannel = message.guild!.channels.cache.get(config.logChannelId) as TextChannel | undefined;
      if (logChannel) {
        const logEmbed = Embed.moderation(
          "AutoMod - Regelverstoß",
          undefined,
          [
            { name: "Benutzer", value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: "Aktion", value: action.toUpperCase(), inline: true },
            { name: "Warnpunkte", value: String(currentPoints), inline: true },
            { name: "Grund", value: reason, inline: false },
            { name: "Nachricht (Vorschau)", value: message.content.substring(0, 200) || "(leer)", inline: false },
          ]
        );
        await logChannel.send({ embeds: [logEmbed] }).catch(() => {});
      }
    }

    logger.info(`[AutoMod] ${message.author.tag} in ${message.guild!.name}: ${action} | ${reason}`);
  }

  // Public API for commands
  static addWarnPoints(guildId: string, userId: string, points: number): number {
    const key = `${guildId}:${userId}`;
    const current = (warnPoints.get(key) ?? 0) + points;
    warnPoints.set(key, current);
    return current;
  }

  static resetWarnPoints(guildId: string, userId: string): void {
    warnPoints.delete(`${guildId}:${userId}`);
  }

  static getWarnPoints(guildId: string, userId: string): number {
    return warnPoints.get(`${guildId}:${userId}`) ?? 0;
  }
}
