import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command, BotClient } from "../../types";
import { Embed } from "../../lib/embed";

const VOTE_EMOJIS = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟"];

const poll: Command = {
  data: new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Erstellt eine Umfrage")
    .addStringOption((opt) => opt.setName("question").setDescription("Die Frage").setRequired(true))
    .addStringOption((opt) => opt.setName("options").setDescription("Optionen, getrennt durch Komma (max. 10)").setRequired(true)),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString("question", true);
    const rawOptions = interaction.options.getString("options", true).split(",").map((o) => o.trim()).slice(0, 10);
    if (rawOptions.length < 2) return interaction.reply({ embeds: [Embed.error("Fehler", "Bitte mindestens 2 Optionen angeben.")], ephemeral: true });

    const fields = rawOptions.map((opt, i) => ({ name: `${VOTE_EMOJIS[i]} Option ${i + 1}`, value: opt, inline: true }));
    const embed = Embed.info(`📊 Umfrage: ${question}`, `Stimme mit den Reaktionen ab!`, fields)
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    for (let i = 0; i < rawOptions.length; i++) {
      await msg.react(VOTE_EMOJIS[i]).catch(() => {});
    }
  },
};
export default poll;
