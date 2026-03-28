import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";

const skip: Command = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Überspringt den aktuellen Song"),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const queue = client.distube.getQueue(interaction.guild!);
    if (!queue) return interaction.reply({ embeds: [Embed.error("Keine Musik", "Es läuft gerade keine Musik.")], ephemeral: true });
    const skipped = queue.songs[0];
    await client.distube.skip(interaction.guild!);
    await interaction.reply({ embeds: [Embed.music("Song übersprungen", `**${skipped.name}** wurde übersprungen.`)] });
  },
};
export default skip;
