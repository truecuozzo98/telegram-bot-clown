import { neon } from 'jsr:@neon/serverless@^0.10.1';

const databaseUrl = Deno.env.get('DATABASE_URL')!;
const sql = neon(databaseUrl);

// Ottieni il punteggio di un utente
export async function getClownScore(chatId: number, userId: number) {
  const rows = await sql`
    SELECT score, username, message_id FROM clowns WHERE chat_id = ${chatId} AND user_id = ${userId}
  `;
  if (rows.length > 0) {
    return rows[0] as { score: number; username: string; message_id: number };
  }
  return { score: 0, username: "", message_id: 0 };
}

export async function setClownScore(
  chatId: number,
  userId: number,
  username: string,
  score: number,
  message: string,
  messageTimestamp: Date,
  messageId: number,
) {
  // Recupera i dati già presenti
  const rows = await sql`
    SELECT message, message_timestamp, message_id FROM clowns WHERE chat_id = ${chatId} AND user_id = ${userId}
  `;

  // Parsing o inizializzazione degli array
  let messagesArr: string[] = [];
  let timestampsArr: string[] = [];
  let messageIdsArr: number[] = [];

  if (rows.length > 0) {
    try {
      messagesArr = JSON.parse(rows[0].message || "[]");
    } catch { messagesArr = []; }
    try {
      timestampsArr = JSON.parse(rows[0].message_timestamp || "[]");
    } catch { timestampsArr = []; }
    try {
      messageIdsArr = JSON.parse(rows[0].message_id || "[]");
    } catch { messageIdsArr = []; }
  }

  // Aggiungi il nuovo dato in coda
  messagesArr.push(message);
  timestampsArr.push(messageTimestamp.toISOString());
  messageIdsArr.push(messageId);

  // Serializza in JSON
  const newMessages = JSON.stringify(messagesArr);
  const newTimestamps = JSON.stringify(timestampsArr);
  const newMessageIds = JSON.stringify(messageIdsArr);

  await sql`
    INSERT INTO clowns (user_id, chat_id, username, score, message, message_timestamp, message_id)
    VALUES (${userId}, ${chatId}, ${username}, ${score}, ${newMessages}, ${newTimestamps}, ${newMessageIds})
    ON CONFLICT (chat_id, user_id) DO UPDATE
    SET score = ${score}, username = ${username}, message = ${newMessages}, message_timestamp = ${newTimestamps}, message_id = ${newMessageIds}
  `;
}

// Ottieni la leaderboard della chat
export async function getLeaderboard(chatId: number) {
  const rows = await sql`
    SELECT username, score, message_id FROM clowns WHERE chat_id = ${chatId} ORDER BY score DESC
  `;
  return rows as { username: string; score: number; message_id: number }[];
}

// Cancella tutti i punteggi di una chat
export async function dropClownScores(chatId: number) {
  await sql`
    DELETE FROM clowns WHERE chat_id = ${chatId}
  `;
}

export async function getUserMessages(chatId: number, userId: number) {
  const rows = await sql`
    SELECT message, message_timestamp, message_id
    FROM clowns
    WHERE chat_id = ${chatId} AND user_id = ${userId}
    ORDER BY message_timestamp DESC
  `;
  return rows as { message: string; message_timestamp: string; message_id: number }[];
}