import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { AutoModManager } from "../../managers/AutoModManager";

const warn: Command = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Verwarnt ein Mitglied")
    .addUserOption((opt) => opt.setName("user").setDescription("Das Mitglied").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Grund").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getMember("user") as GuildMember;
    const reason = interaction.options.getString("reason", true);
    if (!target || target.user.bot) return interaction.reply({ embeds: [Embed.error("Fehler", "Ungültiges Mitglied.")], ephemeral: true });
    const points = AutoModManager.addWarnPoints(interaction.guild!.id, target.id, 1);
    await target.user.send({ embeds: [Embed.warning("Du wurdest verwarnt", `**Server:** ${interaction.guild!.name}\n**Grund:** ${reason}\n**Warnpunkte:** ${points}`)] }).catch(() => {});
    await interaction.reply({ embeds: [Embed.moderation("Verwarnung erteilt", undefined, [
      { name: "Mitglied", value: `${target.user.tag}`, inline: true },
      { name: "Warnpunkte", value: String(points), inline: true },
      { name: "Grund", value: reason, inline: false },
    ])] });
  },
};
export default warn;
