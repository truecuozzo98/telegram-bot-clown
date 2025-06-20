"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const grammy_1 = require("grammy");
// Carica le variabili da .env
(0, dotenv_1.config)();
// Legge il token dall'env
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error("TELEGRAM_BOT_TOKEN non definito in .env");
    process.exit(1);
}
// Crea un'istanza del bot con il token
const bot = new grammy_1.Bot(token);
// Gestisci il comando /start
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Gestisci altri messaggi
bot.on("message", (ctx) => ctx.reply("Got another message!"));
// Avvia il bot
bot.start();