// ╔══════════════════════════════════════════════════════════════════╗
// ║              BotForge MusicManager                               ║
// ║  Handles DisTube events and music queue management              ║
// ╚══════════════════════════════════════════════════════════════════╝
import { Client, TextChannel } from "discord.js";
import { Queue, Song } from "distube";
import { Embed } from "../lib/embed";
import { logger } from "../lib/logger";
import { BotClient } from "../types";

// Active music text channels per guild
const musicChannels = new Map<string, TextChannel>();

export class MusicManager {
  static init(client: BotClient): void {
    const distube = client.distube;

    // ─── Song start ───
    distube.on("playSong", (queue: Queue, song: Song) => {
      const channel = musicChannels.get(queue.id);
      if (!channel) return;
      channel.send({
        embeds: [
          Embed.music("Jetzt wird gespielt", undefined, [
            { name: "🎵 Titel", value: song.name ?? "Unbekannt", inline: true },
            { name: "⏱️ Dauer", value: song.formattedDuration ?? "∞", inline: true },
            { name: "👤 Angefordert von", value: (song.member as any)?.displayName ?? "Unbekannt", inline: true },
            { name: "🔊 Lautstärke", value: `${queue.volume}%`, inline: true },
            { name: "🔁 Loop", value: queue.repeatMode === 1 ? "Song" : queue.repeatMode === 2 ? "Warteschlange" : "Aus", inline: true },
          ]).setThumbnail(song.thumbnail ?? null),
        ],
      }).catch(() => {});
    });

    // ─── Add song to queue ───
    distube.on("addSong", (queue: Queue, song: Song) => {
      const channel = musicChannels.get(queue.id);
      if (!channel) return;
      channel.send({
        embeds: [
          Embed.music("Zur Warteschlange hinzugefügt", undefined, [
            { name: "🎵 Titel", value: song.name ?? "Unbekannt", inline: true },
            { name: "📍 Position", value: String(queue.songs.length), inline: true },
            { name: "⏱️ Dauer", value: song.formattedDuration ?? "∞", inline: true },
          ]),
        ],
      }).catch(() => {});
    });

    // ─── Queue end ───
    distube.on("finish", (queue: Queue) => {
      const channel = musicChannels.get(queue.id);
      channel?.send({ embeds: [Embed.music("Warteschlange beendet", "Alle Songs wurden abgespielt! Füge mehr Songs mit `/play` hinzu.")] }).catch(() => {});
      musicChannels.delete(queue.id);
    });

    // ─── Errors ───
    distube.on("error", (channel, error) => {
      logger.error("[Music] DisTube error:", error);
      if (channel) {
        (channel as TextChannel).send({
          embeds: [Embed.error("Musik-Fehler", `Ein Fehler ist aufgetreten:\n\`${error.message}\``)],
        }).catch(() => {});
      }
    });

    // ─── Empty queue ───
    distube.on("empty", (queue: Queue) => {
      const channel = musicChannels.get(queue.id);
      channel?.send({ embeds: [Embed.warning("Sprachkanal leer", "Verlasse den Kanal da keine Mitglieder mehr anwesend sind.")] }).catch(() => {});
    });

    // ─── Search result ───
    distube.on("searchResult", (message, result) => {
      let msg = result
        .map((song, i) => `**${i + 1}.** ${song.name} — \`${song.formattedDuration}\``)
        .join("\n");
      (message.channel as TextChannel).send({
        embeds: [Embed.music("Suchergebnisse", `${msg}\n\nGib eine Zahl ein, um einen Song auszuwählen.`)],
      }).catch(() => {});
    });

    logger.info("[Music] MusicManager initialized.");
  }

  static setMusicChannel(guildId: string, channel: TextChannel): void {
    musicChannels.set(guildId, channel);
  }

  static getMusicChannel(guildId: string): TextChannel | undefined {
    return musicChannels.get(guildId);
  }

  // Format a queue display
  static formatQueue(songs: Song[], currentIndex: number = 0): string {
    if (!songs.length) return "Warteschlange ist leer.";
    return songs
      .slice(0, 10)
      .map((s, i) => `${i === 0 ? "▶️" : `${i + currentIndex}.`} **${s.name}** [\`${s.formattedDuration}\`]`)
      .join("\n") + (songs.length > 10 ? `\n*...und ${songs.length - 10} weitere*` : "");
  }
}
