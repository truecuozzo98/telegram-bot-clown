import { neon } from '@neon/serverless';

const databaseUrl = Deno.env.get('DATABASE_URL')!;
const sql = neon(databaseUrl);

// Ottieni il punteggio di un utente
export async function getClownScore(chatId: number, userId: number) {
  const rows = await sql`
    SELECT score, username FROM clowns WHERE chat_id = ${chatId} AND user_id = ${userId}
  `;
  if (rows.length > 0) {
    return rows[0] as { score: number; username: string };
  }
  return { score: 0, username: "" };
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
  await sql`
    INSERT INTO clowns (user_id, chat_id, username, score, message, message_timestamp)
    VALUES (${userId}, ${chatId}, ${username}, ${score}, ${message}, ${messageTimestamp})
    ON CONFLICT (user_id) DO UPDATE
    SET score = ${score}, username = ${username}, message = ${message}, message_timestamp = ${messageTimestamp}
  `;
}

// Ottieni la leaderboard della chat
export async function getLeaderboard(chatId: number) {
  const rows = await sql`
    SELECT username, score FROM clowns WHERE chat_id = ${chatId} ORDER BY score DESC
  `;
  return rows as { username: string; score: number }[];
}

// Cancella tutti i punteggi di una chat
export async function dropClownScores(chatId: number) {
  await sql`
    DELETE FROM clowns WHERE chat_id = ${chatId}
  `;
}