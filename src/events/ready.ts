import { Events, Client } from "discord.js";
import { logger } from "../lib/logger";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    logger.info(`[Ready] BotForge is online as ${client.user?.tag}`);
    logger.info(`[Ready] Serving ${client.guilds.cache.size} guilds | ${client.users.cache.size} users`);
  },
};
