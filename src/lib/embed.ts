// ╔══════════════════════════════════════════════════════════════════╗
// ║           BotForge - Standard Embed Helper                       ║
// ║  EVERY bot response MUST use createStandardEmbed().             ║
// ║  Footer: BotForge/Fufi icon + "Powered by BotForge/Fufi | time" ║
// ╚══════════════════════════════════════════════════════════════════╝

import { EmbedBuilder, APIEmbedField, ColorResolvable, EmbedAuthorOptions } from "discord.js";

// ─────────────────────────────────────────────
// BotForge Branding
// ─────────────────────────────────────────────
export const BOTFORGE_FOOTER_ICON =
  "https://cdn.discordapp.com/attachments/1484888992209047696/1487168273240952923/file_00000000f688720abc73d778f13d5c871.png?ex=69c828e2&is=69c6d762&hm=6a5094c30011584a0f254b5bcc7d1febd4bec92c3b199c2df7d88bbb6e63b5e9&";

export const BOTFORGE_COLORS = {
  primary: 0x7C3AED, success: 0x57F287, error: 0xED4245,
  warning: 0xFEE75C, info: 0x5865F2, music: 0x1DB954,
  economy: 0xF59E0B, moderation: 0xEF4444, logging: 0xFBBF24, stats: 0x3B82F6,
} as const;

export interface StandardEmbedOptions {
  title?: string; description?: string;
  color?: ColorResolvable | keyof typeof BOTFORGE_COLORS;
  fields?: APIEmbedField[]; author?: EmbedAuthorOptions;
  thumbnail?: string; image?: string; url?: string; timestamp?: boolean;
}

// ─────────────────────────────────────────────
// createStandardEmbed() - Core Hilfsfunktion
// MUSS für jede einzelne Bot-Antwort genutzt werden.
// Hängt automatisch den pflichtigen BotForge-Footer an.
// ─────────────────────────────────────────────
export function createStandardEmbed(options: StandardEmbedOptions = {}): EmbedBuilder {
  const { title, description, color = "primary", fields = [], author, thumbnail, image, url, timestamp = true } = options;

  const resolvedColor: ColorResolvable =
    typeof color === "string" && color in BOTFORGE_COLORS
      ? BOTFORGE_COLORS[color as keyof typeof BOTFORGE_COLORS]
      : (color as ColorResolvable);

  const now = new Date().toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Europe/Berlin",
  });

  const embed = new EmbedBuilder()
    .setColor(resolvedColor)
    .setFooter({ text: `Powered by BotForge/Fufi | ${now}`, iconURL: BOTFORGE_FOOTER_ICON });

  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length > 0) embed.addFields(fields);
  if (author) embed.setAuthor(author);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (url) embed.setURL(url);
  if (timestamp) embed.setTimestamp();

  return embed;
}

// Shortcut-Helpers — alle rufen intern createStandardEmbed() auf
export const Embed = {
  success: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `✅ ${title}`, description, color: "success", fields }),

  error: (title: string, description?: string) =>
    createStandardEmbed({ title: `❌ ${title}`, description, color: "error" }),

  warning: (title: string, description?: string) =>
    createStandardEmbed({ title: `⚠️ ${title}`, description, color: "warning" }),

  info: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `ℹ️ ${title}`, description, color: "info", fields }),

  music: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `🎵 ${title}`, description, color: "music", fields }),

  moderation: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `🛡️ ${title}`, description, color: "moderation", fields }),

  economy: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `🪙 ${title}`, description, color: "economy", fields }),

  stats: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `📊 ${title}`, description, color: "stats", fields }),

  logging: (title: string, description?: string, fields?: APIEmbedField[]) =>
    createStandardEmbed({ title: `📋 ${title}`, description, color: "logging", fields }),
};
