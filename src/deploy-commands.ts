// ╔══════════════════════════════════════════════════════════════════╗
// ║  BotForge — Slash Command Deployment Script                      ║
// ║  Run with: npm run deploy:commands                               ║
// ╚══════════════════════════════════════════════════════════════════╝
import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";

const commands: any[] = [];
const commandsPath = join(__dirname, "commands");
const categoryFolders = readdirSync(commandsPath);

async function main() {
  for (const folder of categoryFolders) {
    const folderPath = join(commandsPath, folder);
    const files = readdirSync(folderPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    for (const file of files) {
      const { default: cmd } = await import(join(folderPath, file));
      if (cmd?.data) {
        commands.push(cmd.data.toJSON());
        console.log(`✅ Loaded: /${cmd.data.name}`);
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN!);
  const clientId = process.env.DISCORD_BOT_CLIENT_ID!;

  console.log(`\n🚀 Deploying ${commands.length} commands to Discord API...`);
  const data = await rest.put(Routes.applicationCommands(clientId), { body: commands }) as any[];
  console.log(`✅ Successfully deployed ${data.length} slash commands!`);
}

main().catch(console.error);
