# 🤖 BotForge Bot

All-in-One Discord Bot built with Discord.js v14 + TypeScript.

## Quick Start

```bash
npm install
cp .env.example .env
# Fill in your .env values
npm run deploy:commands   # Register slash commands with Discord
npm run dev               # Development with hot reload
npm run build && npm start # Production
```

## Manager Modules

| Manager | Funktion |
|---------|---------|
| `AutoModManager` | Multi-Stage Filter + KI-Toxizitätsprüfung (Perspective API) |
| `MusicManager` | DisTube Events, Queue Display, Channel Tracking |
| `LogManager` | Vollständige Server-Protokollierung |
| `EconomyManager` | Coins, XP, Level, Daily, Work, Gambling |
| `StatsManager` | Statistiken sammeln & ans Dashboard senden |

## `createStandardEmbed()` — Pflicht-Hilfsfunktion

```typescript
import { Embed, createStandardEmbed } from "./lib/embed";

// Shortcut-Varianten (empfohlen):
Embed.success("Titel", "Beschreibung")
Embed.error("Fehler", "Nachricht")
Embed.warning("Warnung", "Text")
Embed.music("Song", "Details", fields)
Embed.moderation("Aktion", "Details", fields)
Embed.economy("Konto", "Text", fields)
Embed.stats("Statistik", "Text", fields)

// Vollständige Kontrolle:
createStandardEmbed({
  title: "Mein Titel",
  description: "Meine Beschreibung",
  color: "primary",
  fields: [{ name: "Feld", value: "Wert", inline: true }],
})
```

**Jedes Embed enthält automatisch den Footer:**
`Powered by BotForge/Fufi | DD.MM.YYYY HH:mm:ss`
