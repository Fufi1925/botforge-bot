import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  Collection,
  Client,
  GuildMember,
} from "discord.js";
import { DisTube } from "distube";

// Extend the Discord.js Client to add custom properties
export interface BotClient extends Client {
  commands: Collection<string, Command>;
  cooldowns: Collection<string, Collection<string, number>>;
  distube: DisTube;
}

// Command interface
export interface Command {
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  cooldown?: number;
  guildOnly?: boolean;
  execute(interaction: ChatInputCommandInteraction, client: BotClient): Promise<void>;
}

// AutoMod warn infraction
export interface Infraction {
  userId: string;
  guildId: string;
  reason: string;
  points: number;
  timestamp: Date;
  moderatorId: string;
}

// Music track info
export interface TrackInfo {
  title: string;
  url: string;
  duration: number;
  thumbnail?: string;
  requestedBy: string;
}

// Economy user data
export interface EconomyUser {
  userId: string;
  guildId: string;
  balance: number;
  xp: number;
  level: number;
  lastDaily?: Date;
  lastWork?: Date;
}
