import { Events, Interaction, Collection } from "discord.js";
import { BotClient, Command } from "../types";
import { Embed } from "../lib/embed";
import { logger } from "../lib/logger";

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction, client: BotClient) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName) as Command | undefined;
    if (!command) {
      return interaction.reply({ embeds: [Embed.error("Unbekannter Befehl", "Dieser Befehl existiert nicht.")], ephemeral: true });
    }

    // Guild-only check
    if (command.guildOnly && !interaction.guild) {
      return interaction.reply({ embeds: [Embed.error("Serverbefehl", "Dieser Befehl kann nur auf einem Server verwendet werden.")], ephemeral: true });
    }

    // Cooldown check
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Collection());
    const timestamps = cooldowns.get(command.data.name)!;
    const cooldownMs = (command.cooldown ?? 3) * 1000;
    const now = Date.now();

    if (timestamps.has(interaction.user.id)) {
      const expiry = timestamps.get(interaction.user.id)! + cooldownMs;
      if (now < expiry) {
        const remaining = ((expiry - now) / 1000).toFixed(1);
        return interaction.reply({
          embeds: [Embed.warning("Cooldown", `Warte noch **${remaining}s** bevor du \`/${command.data.name}\` erneut nutzen kannst.`)],
          ephemeral: true,
        });
      }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownMs);

    // Execute command
    try {
      await command.execute(interaction, client);
    } catch (err: any) {
      logger.error(`[InteractionCreate] Error in /${command.data.name}:`, err);
      const errorEmbed = Embed.error("Interner Fehler", `Ein Fehler ist aufgetreten:\n\`${err.message}\``);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
      }
    }
  },
};
