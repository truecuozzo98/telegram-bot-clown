# 🤡 Clown Score Telegram Bot

A fun Telegram bot built with [Deno](https://deno.land/) and [grammY](https://grammy.dev/) to manage "clown points" in group chats. Users can assign and remove clown points by replying to messages, track a leaderboard, and view messages associated with clown scores.

---

## 📋 Features

- `/start` – Starts the bot.
- `/clown` – Adds a clown point to a user (must be used as a reply).
- `/declown` – Removes a clown point from a user (must be used as a reply).
- `/leaderboard` – Displays the top clown scores in the group.
- `/messaggi` – Lists messages that led to a user's clown points (must be used as a reply).
- `/resetclown` – Resets all clown scores for the current chat.

---

## 🚀 Getting Started

### Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) installed on your machine.
- A [Telegram Bot Token](https://core.telegram.org/bots#how-do-i-create-a-bot) obtained via BotFather.

---

### 📦 Project Structure
project/
├── bot.ts # Main bot logic
├── bot_sql.ts # DB interaction functions
├── README.md # This file

---

### 🛠️ Running Locally
```bash
git clone <your-repo-url>
cd project
deno run --allow-net --allow-env --allow-read --allow-write bot.ts
```
