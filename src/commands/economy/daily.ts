import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { EconomyManager } from "../../managers/EconomyManager";

const daily: Command = {
  data: new SlashCommandBuilder().setName("daily").setDescription("Sammle deine tägliche Belohnung"),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const result = EconomyManager.claimDaily(interaction.guild!.id, interaction.user.id);
    if (!result.success) {
      return interaction.reply({ embeds: [Embed.warning("Bereits abgeholt", `Nächste Belohnung: <t:${Math.floor(result.nextClaim / 1000)}:R>`)], ephemeral: true });
    }
    await interaction.reply({ embeds: [Embed.economy("Tägliche Belohnung", `Du hast **${result.amount} Münzen** erhalten! 🎉\nNächste Belohnung: <t:${Math.floor(result.nextClaim / 1000)}:R>`)] });
  },
};
export default daily;
