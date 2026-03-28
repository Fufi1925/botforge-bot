import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { EconomyManager } from "../../managers/EconomyManager";

const balance: Command = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Zeigt deinen Kontostand und dein Level an")
    .addUserOption((opt) => opt.setName("user").setDescription("Ein anderer Nutzer (optional)")),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser("user") ?? interaction.user;
    const data = EconomyManager.getUser(interaction.guild!.id, target.id);
    await interaction.reply({
      embeds: [Embed.economy(`Konto von ${target.username}`, undefined, [
        { name: "💰 Münzen", value: `${data.balance.toLocaleString("de-DE")}`, inline: true },
        { name: "⭐ Level", value: String(data.level), inline: true },
        { name: "✨ XP", value: `${data.xp} XP`, inline: true },
      ]).setThumbnail(target.displayAvatarURL())],
    });
  },
};
export default balance;
