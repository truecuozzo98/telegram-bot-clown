import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

// Usa il token direttamente o da variabile d'ambiente di Deno Deploy
const token = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN non definito in variabili ambiente");
}

export const bot = new Bot(token);

// Funzione per ottenere il punteggio da Deno KV
async function getClownScore(chatId: number, userId: number): Promise<{ score: number; username: string }> {
  const kv = await Deno.openKv();
  const res = await kv.get<{ score: number; username: string }>(["clown_score", chatId, userId]);
  return res.value ?? { score: 0, username: "" };
}

// Funzione per aggiornare il punteggio su Deno KV
async function setClownScore(chatId: number, userId: number, username: string, score: number) {
  const kv = await Deno.openKv();
  await kv.set(["clown_score", chatId, userId], { score, username });
}

// Funzione per ottenere tutta la leaderboard da Deno KV
async function getLeaderboard(chatId: number): Promise<{ username: string; score: number }[]> {
  const kv = await Deno.openKv();
  const entries: { username: string; score: number }[] = [];
  for await (const entry of kv.list<{ score: number; username: string }>({ prefix: ["clown_score", chatId] })) {
    const value = entry.value;
    if (value) {
      entries.push({ username: value.username, score: value.score });
    }
  }
  // Ordina per punteggio decrescente
  entries.sort((a, b) => b.score - a.score);
  return entries;
}

// Comando /start
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

// ...existing code...

bot.command("clown", async (ctx) => {
  const replyTo = ctx.message?.reply_to_message;
  if (!replyTo || !replyTo.from) {
    await ctx.reply("Usa il comando /clown rispondendo a un messaggio di un membro del gruppo.");
    return;
  }
  const userId = replyTo.from.id;
  const userUsername = replyTo.from.username ?? `${replyTo.from.first_name ?? ""}${replyTo.from.last_name ? " " + replyTo.from.last_name : ""}`;

  // Verifica che non si possa dare punti a se stessi
  if (ctx.from?.id === userId) {
    await ctx.reply("Non puoi dare punti clown a te stesso!");
    return;
  }

  // Leggi e aggiorna il punteggio
  const current = await getClownScore(ctx.chat.id, userId);
  const updated = current.score + 1;
  await setClownScore(ctx.chat.id, userId, userUsername, updated);

  await ctx.reply(`🤡 @${userUsername} ora ha ${updated} punti clown!`);
});

// Comando /declown (ora solo in risposta a un messaggio)
bot.command("declown", async (ctx) => {
  const replyTo = ctx.message?.reply_to_message;
  if (!replyTo || !replyTo.from) {
    await ctx.reply("Usa il comando /declown rispondendo a un messaggio di un membro del gruppo.");
    return;
  }
  const userId = replyTo.from.id;
  const userUsername = replyTo.from.username ?? `${replyTo.from.first_name ?? ""}${replyTo.from.last_name ? " " + replyTo.from.last_name : ""}`;

  // Leggi e aggiorna il punteggio (non andare sotto zero)
  const current = await getClownScore(ctx.chat.id, userId);
  const updated = Math.max(current.score - 1, 0);
  await setClownScore(ctx.chat.id, userId, userUsername, updated);

  await ctx.reply(`🤡 @${userUsername} ora ha ${updated} punti clown!`);
});

// Comando /leaderboard
bot.command("leaderboard", async (ctx) => {
  const leaderboard = await getLeaderboard(ctx.chat.id);
  if (leaderboard.length === 0) {
    await ctx.reply("Nessun punteggio clown ancora registrato!");
    return;
  }
  const text = leaderboard
    .map((entry, idx) => `${idx + 1}. @${entry.username}: ${entry.score} punti`)
    .join("\n");
  await ctx.reply(`🏆 Classifica clown:\n${text}`);
});

async function dropClownScores(chatId: number) {
  const kv = await Deno.openKv();
  for await (const entry of kv.list({ prefix: ["clown_score", chatId] })) {
    await kv.delete(entry.key);
  }
}

// Esempio: comando admin per cancellare tutto
bot.command("resetclown", async (ctx) => {
  // Solo admin!
  const admins = await ctx.getChatAdministrators();
  if (!admins.some(a => a.user.id === ctx.from?.id)) {
    await ctx.reply("Solo gli amministratori possono resettare la classifica.");
    return;
  }
  await dropClownScores(ctx.chat.id);
  await ctx.reply("Tutti i punteggi clown sono stati azzerati!");
});

await bot.api.setMyCommands([
  { command: "start", description: "Avvia il bot" },
  { command: "clown", description: "Aggiungi un punto clown a un utente. Es: /clown @username" },
  { command: "declown", description: "Togli un punto clown a un utente. Es: /declown @username" },
  { command: "leaderboard", description: "Mostra la classifica clown" },
]);


// Gestisci altri messaggi
bot.on("message", (ctx) => ctx.reply("Comando non riconosciuto."));

// Non avviare qui il bot con bot.start() se stai usando webhook