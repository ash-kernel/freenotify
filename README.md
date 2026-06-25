<div align="center">
<img src="assets/image.png" width="400">
</div>

A lightweight Node.js script that automatically fetches the latest free games (from Epic Games, Steam, GOG, etc.) using the GamerPower API and posts them directly to your Discord server via Webhook.

## Features
- **Fully Automated**: Runs quietly in the background and checks for new games every 10 minutes.
- **No Spam**: Remembers previously posted games using a PostgreSQL database so your server only gets pinged for brand new drops.
- **Discord Webhooks**: Uses a simple Discord Webhook instead of a heavy Discord Bot.
- **Slick Embeds**: Posts games using a beautiful black-themed embed containing the game's title, image, platforms, original price, and a direct link to claim it.
- **Role Pings**: Includes a hidden spoiler role ping so your community gets notified without cluttering the chat.

## Prerequisites
- [Node.js](https://nodejs.org/) installed
- A [Discord Webhook URL](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- A PostgreSQL database (e.g., CockroachDB, Supabase, Neon)

## Setup

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Webhook URL and Database URL:
   ```env
   DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
   DATABASE_URL="postgresql://user:password@host:port/database?sslmode=verify-full"
   IGNORED_PLATFORMS=
   REMINDER_DAYS=
   ```

3. **Run the Script:**
   ```bash
   node index.js
   ```
   On the very first run, the script will connect to your database, create the necessary tables, and save all currently free games without posting them (to prevent spam). From then on, it will check every 10 minutes and only post new games!

## License
This project is licensed under the [MIT License](LICENSE).