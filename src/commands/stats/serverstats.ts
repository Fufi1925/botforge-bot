import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { StatsManager } from "../../managers/StatsManager";

const serverstats: Command = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Server- und Nutzungsstatistiken")
    .addSubcommand((sub) => sub.setName("server").setDescription("Server-Gesamtstatistiken"))
    .addSubcommand((sub) => sub.setName("channels").setDescription("Aktivste Kanäle").addIntegerOption((o) => o.setName("limit").setDescription("Anzahl (max 10)").setMaxValue(10)))
    .addSubcommand((sub) => sub.setName("emojis").setDescription("Meistgenutzte Emojis")),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild!;

    if (sub === "server") {
      const stats = StatsManager.getStats(guild.id);
      await interaction.reply({ embeds: [Embed.stats("Server-Statistiken (Heute)", undefined, [
        { name: "👥 Mitglieder", value: String(guild.memberCount), inline: true },
        { name: "💬 Nachrichten", value: String(stats.messageCount), inline: true },
        { name: "👤 Aktive Nutzer", value: String(stats.activeUsers.size), inline: true },
        { name: "🎙️ Sprachminuten", value: String(stats.voiceMinutes), inline: true },
        { name: "📣 Kanäle", value: String(guild.channels.cache.size), inline: true },
        { name: "😀 Emojis", value: String(guild.emojis.cache.size), inline: true },
      ])] });
    } else if (sub === "channels") {
      const limit = interaction.options.getInteger("limit") ?? 5;
      const top = StatsManager.getTopChannels(guild.id, limit);
      await interaction.reply({ embeds: [Embed.stats("Aktivste Kanäle (Heute)", top.map((c, i) => `${i + 1}. <#${c.channelId}> — **${c.count}** Nachrichten`).join("\n") || "Keine Daten")] });
    } else if (sub === "emojis") {
      const top = StatsManager.getTopEmojis(guild.id);
      await interaction.reply({ embeds: [Embed.stats("Meistgenutzte Emojis (Heute)", top.map((e, i) => `${i + 1}. ${e.emoji} — **${e.count}x**`).join("\n") || "Keine Daten")] });
    }
  },
};
export default serverstats;
