import { config } from "dotenv";
import { Bot } from "grammy";

// Carica le variabili da .env
config();

// Legge il token dall'env
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN non definito in .env");
  process.exit(1);
}

// Crea un'istanza del bot con il token
export const bot = new Bot(token);

// Gestisci il comando /start
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Gestisci altri messaggi
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Non avviare qui il bot con bot.start() se usi webhook!