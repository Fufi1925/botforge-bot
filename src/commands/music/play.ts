// ╔══════════════════════════════════════════════════════════════════╗
// ║  BotForge — /play Slash Command                                  ║
// ║  Plays music in a voice channel using DisTube                   ║
// ╚══════════════════════════════════════════════════════════════════╝
import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, TextChannel } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { MusicManager } from "../../managers/MusicManager";

const play: Command = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Spielt einen Song oder eine Playlist ab")
    .addStringOption((opt) =>
      opt.setName("query")
         .setDescription("Song-Name, URL (SoundCloud, Spotify, Webradio, direkte URL)")
         .setRequired(true)
    ),
  cooldown: 3,
  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    await interaction.deferReply();

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;

    // Check if user is in a voice channel
    if (!voiceChannel) {
      return interaction.editReply({
        embeds: [Embed.error("Kein Sprachkanal", "Du musst dich in einem Sprachkanal befinden, um Musik abzuspielen.")],
      });
    }

    // Check bot permissions in voice channel
    const permissions = voiceChannel.permissionsFor(interaction.guild!.members.me!);
    if (!permissions?.has(["Connect", "Speak"])) {
      return interaction.editReply({
        embeds: [Embed.error("Fehlende Berechtigungen", "Ich benötige **Verbinden** und **Sprechen** Berechtigungen in deinem Sprachkanal.")],
      });
    }

    const query = interaction.options.getString("query", true);

    // Set the music text channel
    MusicManager.setMusicChannel(interaction.guild!.id, interaction.channel as TextChannel);

    // Loading embed
    await interaction.editReply({
      embeds: [Embed.music("Suche…", `\`${query}\``)],
    });

    try {
      // DisTube handles all sources automatically
      await client.distube.play(voiceChannel, query, {
        member,
        textChannel: interaction.channel as TextChannel,
        skip: false,
      });

      // The playSong/addSong events in MusicManager handle the response messages
    } catch (error: any) {
      await interaction.editReply({
        embeds: [Embed.error("Wiedergabefehler", `Konnte Song nicht laden:\n\`${error.message}\`\n\n**Tipps:**\n• Versuche einen anderen Suchbegriff\n• Stelle sicher, dass die URL gültig ist\n• YouTube-Links können eingeschränkt sein`)],
      });
    }
  },
};

export default play;
