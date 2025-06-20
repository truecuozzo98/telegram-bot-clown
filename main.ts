
import { webhookCallback } from "https://deno.land/x/grammy@v1.36.3/mod.ts";
// You might modify this to the correct way to import your `Bot` object.
import { bot } from "./bot.ts";

const webhookUrl = `https://api.telegram.org/bot${bot.token}/setWebhook?url=https://truecuozzo9-telegram-bo-67.deno.dev/${bot.token}`;
console.log(webhookUrl);

const handleUpdate = webhookCallback(bot, "std/http");

Deno.serve(async (req: { method: string; url: string | URL; }) => {
  if (req.method === "POST") {
    const url = new URL(req.url);
    if (url.pathname.slice(1) === bot.token) {
      try {
        return await handleUpdate(req);
      } catch (err) {
        console.error(err);
      }
    }
  }
  return new Response();
});