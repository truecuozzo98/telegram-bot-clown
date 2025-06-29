import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

import {
  getClownScore,
  setClownScore,
  getLeaderboard,
  dropClownScores,
  getUserMessages,
} from "./bot_sql.ts";

// Usa il token direttamente o da variabile d'ambiente di Deno Deploy
const token = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN non definito in variabili ambiente");
}

export const bot = new Bot(token);

// Comando /start
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.command("clown", async (ctx) => {
  const replyTo = ctx.message?.reply_to_message;
  if (!replyTo || !replyTo.from) {
    await ctx.reply("Rispondi a un messaggio di un membro del gruppo.");
    return;
  }
  const userId = replyTo.from.id;
  const chatId = ctx.chat.id;
  const username = replyTo.from.username ?? `${replyTo.from.first_name ?? ""}${replyTo.from.last_name ? " " + replyTo.from.last_name : ""}`;
  const message = replyTo.text ?? "";
  const messageTimestamp = new Date(((replyTo.date ?? Math.floor(Date.now() / 1000)) * 1000) + 2 * 60 * 60 * 1000);
  const current = await getClownScore(chatId, userId);
  const currentScore = Number(current.score) || 0;
  const updated = currentScore + 1;
  const messageId = replyTo.message_id;
  await setClownScore(chatId, userId, username, updated, message, messageTimestamp, messageId);

  await ctx.reply(`🤡 @${username} ora ha ${updated} punti clown!`);
});

bot.command("declown", async (ctx) => {
  const replyTo = ctx.message?.reply_to_message;
  if (!replyTo || !replyTo.from) {
    await ctx.reply("Rispondi a un messaggio di un membro del gruppo.");
    return;
  }
  const userId = replyTo.from.id;
  const chatId = ctx.chat.id;
  const username = replyTo.from.username ?? `${replyTo.from.first_name ?? ""}${replyTo.from.last_name ? " " + replyTo.from.last_name : ""}`;
  const message = replyTo.text ?? "";
  const messageTimestamp = new Date((replyTo.date ?? Math.floor(Date.now() / 1000)) * 1000);

  const current = await getClownScore(chatId, userId);
  const currentScore = Number(current.score) || 0;
  const updated = Math.max(currentScore - 1, 0);
  const messageId = replyTo.message_id;
  await setClownScore(chatId, userId, username, updated, message, messageTimestamp, messageId);

  await ctx.reply(`🤡 @${username} ora ha ${updated} punti clown!`);
});

bot.command("leaderboard", async (ctx) => {
  const chatId = ctx.chat.id;
  const leaderboard = await getLeaderboard(chatId);
  if (leaderboard.length === 0) {
    await ctx.reply("Nessun punteggio clown ancora registrato!");
    return;
  }
  const text = leaderboard
    .map((entry, idx) => `${idx + 1}. @${entry.username}: ${entry.score} punti`)
    .join("\n");
  await ctx.reply(`🏆 Classifica clown:\n${text}`);
});

bot.command("resetclown", async (ctx) => {
  await dropClownScores(ctx.chat.id);
  await ctx.reply("Tutti i punteggi clown sono stati azzerati!");
});

// ...existing code...

bot.command("messaggi", async (ctx) => {
  const replyTo = ctx.message?.reply_to_message;
  if (!replyTo || !replyTo.from) {
    await ctx.reply("Usa /messaggi rispondendo a un messaggio dell'utente di cui vuoi vedere i messaggi.");
    return;
  }
  const userId = replyTo.from.id;
  const chatId = ctx.chat.id;
  const username = replyTo.from.username ?? `${replyTo.from.first_name ?? ""}${replyTo.from.last_name ? " " + replyTo.from.last_name : ""}`;

  const rows = await getUserMessages(chatId, userId);

  if (rows.length === 0 || !rows[0].message) {
    await ctx.reply(`Nessun messaggio salvato per @${username}.`);
    return;
  }

  // Decodifica i campi JSON
  let messagesArr: string[] = [];
  let timestampsArr: string[] = [];
  try {
    messagesArr = JSON.parse(rows[0].message || "[]");
  } catch { messagesArr = []; }
  try {
    timestampsArr = JSON.parse(rows[0].message_timestamp || "[]");
  } catch { timestampsArr = []; }

  if (messagesArr.length === 0) {
    await ctx.reply(`Nessun messaggio salvato per @${username}.`);
    return;
  }

  const text = messagesArr
    .map((msg, i) => {
      const ts = timestampsArr[timestampsArr.length - messagesArr.length + i] || "";
      // Aggiungi 2 ore al timestamp
      let dateStr = "";
      if (ts) {
        const date = new Date(new Date(ts).getTime() + 2 * 60 * 60 * 1000);
        dateStr = ` (${date.toLocaleString()})`;
      }
      return `${i + 1}. ${msg}${dateStr}`;
    })
    .join("\n\n");

  await ctx.reply(`I messaggi di @${username}:\n\n${text}`);
});

// ...existing code...

await bot.api.setMyCommands([
  { command: "start", description: "Avvia il bot" },
  { command: "clown", description: "Aggiungi un punto clown a un utente." },
  { command: "declown", description: "Togli un punto clown a un utente." },
  { command: "leaderboard", description: "Mostra la classifica clown" },
  { command: "messaggi", description: "Mostra tutti i messaggi da clown dell'utente" },
]);