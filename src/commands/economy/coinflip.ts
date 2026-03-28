import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { EconomyManager } from "../../managers/EconomyManager";

const coinflip: Command = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Setze Münzen auf Kopf oder Zahl")
    .addIntegerOption((opt) => opt.setName("bet").setDescription("Einsatz").setRequired(true).setMinValue(1))
    .addStringOption((opt) => opt.setName("choice").setDescription("Kopf oder Zahl").setRequired(true).addChoices(
      { name: "Kopf (Heads)", value: "heads" },
      { name: "Zahl (Tails)", value: "tails" }
    )),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const bet = interaction.options.getInteger("bet", true);
    const choice = interaction.options.getString("choice", true) as "heads" | "tails";
    try {
      const result = EconomyManager.gambleCoinflip(interaction.guild!.id, interaction.user.id, bet, choice);
      const resultLabel = result.won ? "✅ GEWONNEN" : "❌ VERLOREN";
      await interaction.reply({
        embeds: [(result.won ? Embed.success : Embed.error)(
          `Coinflip — ${resultLabel}`,
          `Du hast ${choice === "heads" ? "Kopf" : "Zahl"} gewählt.\n**${result.won ? `+${result.amount}` : `-${result.amount}`} Münzen**\nNeuer Kontostand: **${result.balance.toLocaleString()}**`
        )],
      });
    } catch (err: any) {
      await interaction.reply({ embeds: [Embed.error("Fehler", err.message)], ephemeral: true });
    }
  },
};
export default coinflip;
