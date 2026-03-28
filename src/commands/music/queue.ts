import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { MusicManager } from "../../managers/MusicManager";

const queue: Command = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Zeigt die aktuelle Musikwarteschlange")
    .addIntegerOption((opt) =>
      opt.setName("page").setDescription("Seitenummer").setMinValue(1)
    ),
  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const queue = client.distube.getQueue(interaction.guild!);
    if (!queue || !queue.songs.length) {
      return interaction.reply({
        embeds: [Embed.warning("Warteschlange leer", "Es wird gerade nichts abgespielt.")], ephemeral: true,
      });
    }

    const page = interaction.options.getInteger("page") ?? 1;
    const perPage = 10;
    const start = (page - 1) * perPage;
    const songs = queue.songs.slice(start, start + perPage);
    const totalPages = Math.ceil(queue.songs.length / perPage);

    const songList = songs
      .map((s, i) => `${start + i === 0 ? "▶️" : `\`${start + i}.\``} **${s.name}** [\`${s.formattedDuration}\`] — ${(s.member as GuildMember)?.displayName ?? "?"}`)
      .join("\n");

    await interaction.reply({
      embeds: [
        Embed.music(
          `Warteschlange (${queue.songs.length} Songs)`,
          songList,
          [
            { name: "Lautstärke", value: `${queue.volume}%`, inline: true },
            { name: "Loop", value: queue.repeatMode === 1 ? "Song" : queue.repeatMode === 2 ? "Queue" : "Aus", inline: true },
            { name: "Seite", value: `${page}/${totalPages}`, inline: true },
          ]
        ),
      ],
    });
  },
};
export default queue;
