import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";

const timeout: Command = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Setzt ein Mitglied in Timeout")
    .addUserOption((opt) => opt.setName("user").setDescription("Das Mitglied").setRequired(true))
    .addIntegerOption((opt) => opt.setName("minutes").setDescription("Dauer in Minuten (1-40320)").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption((opt) => opt.setName("reason").setDescription("Grund"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getMember("user") as GuildMember;
    const minutes = interaction.options.getInteger("minutes", true);
    const reason = interaction.options.getString("reason") ?? "Kein Grund angegeben";
    if (!target) return interaction.reply({ embeds: [Embed.error("Fehler", "Mitglied nicht gefunden.")], ephemeral: true });
    await target.timeout(minutes * 60 * 1000, `[${interaction.user.tag}] ${reason}`);
    await interaction.reply({ embeds: [Embed.moderation("Timeout gesetzt", undefined, [
      { name: "Mitglied", value: target.user.tag, inline: true },
      { name: "Dauer", value: `${minutes} Minuten`, inline: true },
      { name: "Grund", value: reason, inline: false },
    ])] });
  },
};
export default timeout;
