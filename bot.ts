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

// Gestisci altri messaggi
bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Non avviare qui il bot con bot.start() se usi webhook!