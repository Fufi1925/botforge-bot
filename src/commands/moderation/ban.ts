import { ChatInputCommandInteraction, SlashCommandBuilder, GuildMember, PermissionFlagsBits } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";
import { LogManager } from "../../managers/LogManager";

const ban: Command = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bannt ein Mitglied vom Server")
    .addUserOption((opt) => opt.setName("user").setDescription("Das Mitglied").setRequired(true))
    .addStringOption((opt) => opt.setName("reason").setDescription("Grund für den Bann"))
    .addIntegerOption((opt) => opt.setName("days").setDescription("Nachrichten löschen (Tage 0-7)").setMinValue(0).setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getMember("user") as GuildMember;
    const reason = interaction.options.getString("reason") ?? "Kein Grund angegeben";
    const days = interaction.options.getInteger("days") ?? 0;

    if (!target) return interaction.reply({ embeds: [Embed.error("Fehler", "Mitglied nicht gefunden.")], ephemeral: true });
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [Embed.error("Fehler", "Du kannst dich nicht selbst bannen.")], ephemeral: true });
    if (!target.bannable) return interaction.reply({ embeds: [Embed.error("Fehler", "Ich kann dieses Mitglied nicht bannen (zu hohe Rolle).")], ephemeral: true });

    // DM the target before banning
    await target.user.send({
      embeds: [Embed.error(`Du wurdest von ${interaction.guild!.name} gebannt`, `**Grund:** ${reason}`)],
    }).catch(() => {});

    await target.ban({ deleteMessageSeconds: days * 86400, reason: `[${interaction.user.tag}] ${reason}` });

    const embed = Embed.moderation("Mitglied gebannt", undefined, [
      { name: "Mitglied", value: `${target.user.tag} (${target.id})`, inline: true },
      { name: "Moderator", value: `${interaction.user.tag}`, inline: true },
      { name: "Grund", value: reason, inline: false },
    ]);

    await interaction.reply({ embeds: [embed] });
    await LogManager.logModAction(interaction.guild!.id, embed);
  },
};
export default ban;
