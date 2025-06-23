import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

// Get the connection string from the environment variable "DATABASE_URL"
const databaseUrl = Deno.env.get("DATABASE_URL")!;

// Create a database pool with three connections that are lazily established
const pool = new Pool(databaseUrl, 3, true);

// Ottieni il punteggio di un utente
export async function getClownScore(chatId: number, userId: number) {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ score: number; username: string }>(
      "SELECT score, username FROM clowns WHERE chat_id = $1 AND user_id = $2",
      [chatId, userId],
    );
    if (result.rows.length > 0) {
      return result.rows[0];
    }
    return { score: 0, username: "" };
  } finally {
    client.release();
  }
}

// Aggiorna o inserisci il punteggio di un utente
export async function setClownScore(
  chatId: number,
  userId: number,
  username: string,
  score: number,
  message: string,
  messageTimestamp: Date,
) {
  const client = await pool.connect();
  try {
    await client.queryObject(
      `INSERT INTO clowns (user_id, chat_id, username, score, message, message_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) DO UPDATE
       SET score = $4, username = $3, message = $5, message_timestamp = $6`,
      [userId, chatId, username, score, message, messageTimestamp],
    );
  } finally {
    client.release();
  }
}

// Ottieni la leaderboard della chat
export async function getLeaderboard(chatId: number) {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<{ username: string; score: number }>(
      "SELECT username, score FROM clowns WHERE chat_id = $1 ORDER BY score DESC",
      [chatId],
    );
    return result.rows;
  } finally {
    client.release();
  }
}

// Cancella tutti i punteggi di una chat
export async function dropClownScores(chatId: number) {
  const client = await pool.connect();
  try {
    await client.queryObject("DELETE FROM clowns WHERE chat_id = $1", [chatId]);
  } finally {
    client.release();
  }
}