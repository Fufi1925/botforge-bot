import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";

const volume: Command = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Stellt die Lautstärke ein")
    .addIntegerOption((opt) =>
      opt.setName("level").setDescription("Lautstärke 1-150").setRequired(true).setMinValue(1).setMaxValue(150)
    ),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const queue = client.distube.getQueue(interaction.guild!);
    if (!queue) return interaction.reply({ embeds: [Embed.error("Keine Musik", "Es läuft gerade keine Musik.")], ephemeral: true });
    const level = interaction.options.getInteger("level", true);
    await client.distube.setVolume(interaction.guild!, level);
    await interaction.reply({ embeds: [Embed.music("Lautstärke angepasst", `Lautstärke auf **${level}%** gesetzt.`)] });
  },
};
export default volume;
