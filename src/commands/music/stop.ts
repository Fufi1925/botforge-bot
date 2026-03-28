import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";

const stop: Command = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stoppt die Musik und leert die Warteschlange"),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const queue = client.distube.getQueue(interaction.guild!);
    if (!queue) return interaction.reply({ embeds: [Embed.error("Keine Musik", "Es läuft gerade keine Musik.")], ephemeral: true });
    await client.distube.stop(interaction.guild!);
    await interaction.reply({ embeds: [Embed.music("Musik gestoppt", "Warteschlange wurde geleert und der Bot hat den Sprachkanal verlassen.")] });
  },
};
export default stop;
