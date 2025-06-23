import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

const token = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN non definito in variabili ambiente");
}

export const bot = new Bot(token);

// Funzione per ottenere il punteggio da Deno KV
async function getClownScore(chatId: number | string, userId: number): Promise<{ score: number; username: string }> {
  const kv = await Deno.openKv();
  const res = await kv.get<{ score: number; username: string }>(["clown_score", chatId, userId]);
  return res.value ?? { score: 0, username: "" };
}

// Funzione per aggiornare il punteggio su Deno KV
async function setClownScore(chatId: number | string, userId: number, username: string, score: number) {
  const kv = await Deno.openKv();
  await kv.set(["clown_score", chatId, userId], { score, username });
}

// Funzione per ottenere tutta la leaderboard da Deno KV per un gruppo
async function getLeaderboard(chatId: number | string): Promise<{ userId: number; username: string; score: number }[]> {
  const kv = await Deno.openKv();
  const entries: { userId: number; username: string; score: number }[] = [];
  for await (const entry of kv.list<{ score: number; username: string }>({ prefix: ["clown_score", chatId] })) {
    const userId = entry.key[2] as number;
    const { score, username } = entry.value ?? { score: 0, username: "" };
    entries.push({ userId, username, score });
  }
  entries.sort((a, b) => b.score - a.score);
  return entries;
}

// Comando /clown @username
bot.command("clown", async (ctx) => {
  const match = ctx.match?.trim().match(/^@(\w+)/);
  if (!match) {
    await ctx.reply("Usa il comando così: /clown @username");
    return;
  }
  const username = match[1];

  // Cerca l'user_id nel gruppo tramite getChatMember
  try {
    const member = await ctx.api.getChatMember(ctx.chat.id, `@${username}`);
    const userId = member.user.id;
    const userUsername = member.user.username ?? username;

    // Leggi e aggiorna il punteggio
    const current = await getClownScore(ctx.chat.id, userId);
    const updated = current.score + 1;
    await setClownScore(ctx.chat.id, userId, userUsername, updated);

    await ctx.reply(`🤡 @${userUsername} ora ha ${updated} punti clown!`);
  } catch {
    await ctx.reply(`Non riesco a trovare @${username} in questo gruppo!`);
  }
});

// Comando /declown @username
bot.command("declown", async (ctx) => {
  const match = ctx.match?.trim().match(/^@(\w+)/);
  if (!match) {
    await ctx.reply("Usa il comando così: /declown @username");
    return;
  }
  const username = match[1];

  try {
    const member = await ctx.api.getChatMember(ctx.chat.id, `@${username}`);
    const userId = member.user.id;
    const userUsername = member.user.username ?? username;

    const current = await getClownScore(ctx.chat.id, userId);
    const updated = Math.max(current.score - 1, 0);
    await setClownScore(ctx.chat.id, userId, userUsername, updated);

    await ctx.reply(`🤡 @${userUsername} ora ha ${updated} punti clown!`);
  } catch {
    await ctx.reply(`Non riesco a trovare @${username} in questo gruppo!`);
  }
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

async function dropClownScores() {
  const kv = await Deno.openKv();
  for await (const entry of kv.list({ prefix: ["clown_score"] })) {
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
  await dropClownScores();
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