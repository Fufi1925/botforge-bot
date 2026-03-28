import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { LogManager } from "../../managers/LogManager";

const kick: Command = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kickt ein Mitglied vom Server")
    .addUserOption((opt) => opt.setName("user").setDescription("Das Mitglied").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Grund"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getMember("user") as GuildMember;
    const reason = interaction.options.getString("reason") ?? "Kein Grund angegeben";
    if (!target?.kickable) return interaction.reply({ embeds: [Embed.error("Fehler", "Kann dieses Mitglied nicht kicken.")], ephemeral: true });
    await target.user.send({ embeds: [Embed.warning(`Du wurdest von ${interaction.guild!.name} gekickt`, `**Grund:** ${reason}`)] }).catch(() => {});
    await target.kick(`[${interaction.user.tag}] ${reason}`);
    const embed = Embed.moderation("Mitglied gekickt", undefined, [
      { name: "Mitglied", value: `${target.user.tag}`, inline: true },
      { name: "Moderator", value: interaction.user.tag, inline: true },
      { name: "Grund", value: reason, inline: false },
    ]);
    await interaction.reply({ embeds: [embed] });
    await LogManager.logModAction(interaction.guild!.id, embed);
  },
};
export default kick;
