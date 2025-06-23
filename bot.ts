import { Bot } from "https://deno.land/x/grammy@v1.36.3/mod.ts";

// Usa il token direttamente o da variabile d'ambiente di Deno Deploy
const token = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN non definito in variabili ambiente");
}

export const bot = new Bot(token);

// Funzione per ottenere il punteggio da Deno KV
async function getClownScore(username: string): Promise<number> {
  const kv = await Deno.openKv();
  const res = await kv.get<number>(["clown_score", username]);
  return res.value ?? 0;
}

// Funzione per aggiornare il punteggio su Deno KV
async function setClownScore(username: string, score: number) {
  const kv = await Deno.openKv();
  await kv.set(["clown_score", username], score);
}

// Funzione per ottenere tutta la leaderboard da Deno KV
async function getLeaderboard(): Promise<{ username: string; score: number }[]> {
  const kv = await Deno.openKv();
  const entries: { username: string; score: number }[] = [];
  for await (const entry of kv.list<number>({ prefix: ["clown_score"] })) {
    const username = entry.key[1] as string;
    const score = entry.value ?? 0;
    entries.push({ username, score });
  }
  // Ordina per punteggio decrescente
  entries.sort((a, b) => b.score - a.score);
  return entries;
}

// Comando /start
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

// Comando /clown @username
bot.command("clown", async (ctx) => {
  const match = ctx.match?.trim().match(/^@(\w+)/);
  if (!match) {
    await ctx.reply("Usa il comando così: /clown @username");
    return;
  }
  const username = match[1];

  // Leggi e aggiorna il punteggio
  const current = await getClownScore(username);
  const updated = current + 1;
  await setClownScore(username, updated);

  await ctx.reply(`🤡 @${username} ora ha ${updated} punti clown!`);
});

// Comando /declown @username
bot.command("declown", async (ctx) => {
  const match = ctx.match?.trim().match(/^@(\w+)/);
  if (!match) {
    await ctx.reply("Usa il comando così: /declown @username");
    return;
  }
  const username = match[1];

  // Leggi e aggiorna il punteggio (non andare sotto zero)
  const current = await getClownScore(username);
  const updated = Math.max(current - 1, 0);
  await setClownScore(username, updated);

  await ctx.reply(`🤡 @${username} ora ha ${updated} punti clown!`);
});

// Comando /leaderboard
bot.command("leaderboard", async (ctx) => {
  const leaderboard = await getLeaderboard();
  if (leaderboard.length === 0) {
    await ctx.reply("Nessun punteggio clown ancora registrato!");
    return;
  }
  const text = leaderboard
    .map((entry, idx) => `${idx + 1}. @${entry.username}: ${entry.score} punti`)
    .join("\n");
  await ctx.reply(`🏆 Classifica clown:\n${text}`);
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