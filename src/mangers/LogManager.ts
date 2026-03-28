// ╔══════════════════════════════════════════════════════════════════╗
// ║              BotForge LogManager                                 ║
// ║  Comprehensive server event logging to configured channels       ║
// ╚══════════════════════════════════════════════════════════════════╝
import {
  Client, Message, GuildMember, TextChannel,
  AuditLogEvent, Channel, Role, VoiceState
} from "discord.js";
import { Embed } from "../lib/embed";
import { logger } from "../lib/logger";

interface LogConfig {
  messageEditChannel?: string;
  messageDeleteChannel?: string;
  memberJoinChannel?: string;
  memberLeaveChannel?: string;
  roleChangeChannel?: string;
  voiceChannel?: string;
  modActionChannel?: string;
}

export class LogManager {
  private static guildConfigs = new Map<string, LogConfig>();
  private static client: Client;

  static init(client: Client): void {
    this.client = client;

    // Message events
    client.on("messageUpdate", (oldMsg, newMsg) => {
      if (!oldMsg.guild || oldMsg.author?.bot) return;
      if (oldMsg.content === newMsg.content) return;
      this.logEvent(oldMsg.guild.id, "messageEditChannel", Embed.logging(
        "Nachricht bearbeitet",
        undefined,
        [
          { name: "Benutzer", value: `${oldMsg.author?.tag ?? "?"} (${oldMsg.author?.id})`, inline: true },
          { name: "Kanal", value: `<#${oldMsg.channelId}>`, inline: true },
          { name: "Vorher", value: (oldMsg.content ?? "").substring(0, 400) || "(leer)", inline: false },
          { name: "Nachher", value: (newMsg.content ?? "").substring(0, 400) || "(leer)", inline: false },
        ]
      ));
    });

    client.on("messageDelete", (msg) => {
      if (!msg.guild || msg.author?.bot) return;
      this.logEvent(msg.guild.id, "messageDeleteChannel", Embed.logging(
        "Nachricht gelöscht",
        undefined,
        [
          { name: "Benutzer", value: `${msg.author?.tag ?? "Unbekannt"} (${msg.author?.id ?? "?"})`, inline: true },
          { name: "Kanal", value: `<#${msg.channelId}>`, inline: true },
          { name: "Inhalt", value: (msg.content ?? "").substring(0, 600) || "(leer)", inline: false },
        ]
      ));
    });

    // Member events
    client.on("guildMemberAdd", (member) => {
      this.logEvent(member.guild.id, "memberJoinChannel", Embed.logging(
        "Mitglied beigetreten",
        undefined,
        [
          { name: "Benutzer", value: `${member.user.tag} (${member.id})`, inline: true },
          { name: "Account erstellt", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: "Mitglieder gesamt", value: String(member.guild.memberCount), inline: true },
        ]
      ).setThumbnail(member.user.displayAvatarURL()));
    });

    client.on("guildMemberRemove", (member) => {
      this.logEvent(member.guild.id, "memberLeaveChannel", Embed.logging(
        "Mitglied verlassen",
        undefined,
        [
          { name: "Benutzer", value: `${member.user.tag} (${member.id})`, inline: true },
          { name: "Beigetreten", value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : "Unbekannt", inline: true },
          { name: "Rollen", value: member.roles.cache.filter((r) => r.id !== member.guild.id).map((r) => r.name).join(", ") || "Keine", inline: false },
        ]
      ));
    });

    // Voice state
    client.on("voiceStateUpdate", (oldState: VoiceState, newState: VoiceState) => {
      if (oldState.channelId === newState.channelId) return;
      const member = newState.member ?? oldState.member;
      if (!member || member.user.bot) return;
      const guildId = newState.guild.id;

      if (!oldState.channelId && newState.channelId) {
        this.logEvent(guildId, "voiceChannel", Embed.logging(
          "Sprachkanal beigetreten",
          undefined,
          [
            { name: "Mitglied", value: `${member.user.tag}`, inline: true },
            { name: "Kanal", value: `${newState.channel?.name ?? "?"}`, inline: true },
          ]
        ));
      } else if (oldState.channelId && !newState.channelId) {
        this.logEvent(guildId, "voiceChannel", Embed.logging(
          "Sprachkanal verlassen",
          undefined,
          [
            { name: "Mitglied", value: `${member.user.tag}`, inline: true },
            { name: "Kanal", value: `${oldState.channel?.name ?? "?"}`, inline: true },
          ]
        ));
      } else {
        this.logEvent(guildId, "voiceChannel", Embed.logging(
          "Sprachkanal gewechselt",
          undefined,
          [
            { name: "Mitglied", value: `${member.user.tag}`, inline: true },
            { name: "Von", value: `${oldState.channel?.name ?? "?"}`, inline: true },
            { name: "Nach", value: `${newState.channel?.name ?? "?"}`, inline: true },
          ]
        ));
      }
    });

    logger.info("[LogManager] LogManager initialized.");
  }

  static setConfig(guildId: string, config: LogConfig): void {
    this.guildConfigs.set(guildId, config);
  }

  static async logModAction(guildId: string, embed: ReturnType<typeof Embed.moderation>): Promise<void> {
    await this.logEvent(guildId, "modActionChannel", embed);
  }

  private static async logEvent(
    guildId: string,
    channelKey: keyof LogConfig,
    embed: any
  ): Promise<void> {
    const config = this.guildConfigs.get(guildId);
    if (!config || !config[channelKey]) return;
    const channelId = config[channelKey] as string;
    const channel = this.client.channels.cache.get(channelId) as TextChannel | undefined;
    if (!channel) return;
    await channel.send({ embeds: [embed] }).catch(() => {});
  }
}
