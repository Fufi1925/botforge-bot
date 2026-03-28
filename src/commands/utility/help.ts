import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";

const help: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Zeigt alle verfügbaren Befehle an")
    .addStringOption((opt) => opt.setName("category").setDescription("Kategorie").addChoices(
      { name: "🎵 Musik", value: "music" },
      { name: "🛡️ Moderation", value: "moderation" },
      { name: "🪙 Economy", value: "economy" },
      { name: "📊 Statistiken", value: "stats" },
      { name: "🔧 Utility", value: "utility" },
    )),
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const category = interaction.options.getString("category");

    const categories: Record<string, { emoji: string; desc: string; commands: string[] }> = {
      music: {
        emoji: "🎵", desc: "Premium Musik-System",
        commands: ["/play [query]", "/queue [page]", "/skip", "/stop", "/volume [1-150]", "/loop", "/shuffle", "/nowplaying"],
      },
      moderation: {
        emoji: "🛡️", desc: "Moderations-Tools",
        commands: ["/ban [user] [reason]", "/kick [user] [reason]", "/timeout [user] [min]", "/warn [user] [reason]", "/purge [count]", "/warnings [user]"],
      },
      economy: {
        emoji: "🪙", desc: "Economy & Leveling",
        commands: ["/balance [user]", "/daily", "/work", "/coinflip [bet] [choice]", "/leaderboard", "/shop", "/buy [item]"],
      },
      stats: {
        emoji: "📊", desc: "Server-Statistiken",
        commands: ["/stats server", "/stats user [user]", "/stats channels", "/stats emojis"],
      },
      utility: {
        emoji: "🔧", desc: "Allgemeine Befehle",
        commands: ["/help [category]", "/poll [frage] [optionen]", "/giveaway start", "/ping", "/serverinfo", "/userinfo [user]"],
      },
    };

    if (category && categories[category]) {
      const cat = categories[category];
      return interaction.reply({
        embeds: [Embed.info(
          `${cat.emoji} ${category.charAt(0).toUpperCase() + category.slice(1)} Befehle`,
          cat.desc,
          [{ name: "Verfügbare Befehle", value: cat.commands.map((c) => `\`${c}\``).join("\n") }]
        )],
      });
    }

    // Overview
    await interaction.reply({
      embeds: [Embed.info(
        "BotForge — Befehlsübersicht",
        "Der ultimative All-in-One Discord Bot. Nutze `/help [kategorie]` für Details.",
        Object.entries(categories).map(([key, val]) => ({
          name: `${val.emoji} ${key.charAt(0).toUpperCase() + key.slice(1)}`,
          value: `${val.desc}\n${val.commands.length} Befehle verfügbar`,
          inline: true,
        }))
      )],
    });
  },
};
export default help;
