require('dotenv').config();
const cron = require('node-cron');
const { fetchFreeGames } = require('./api');
const { initDB, loadPostedGames, savePostedGame, savePostedGamesBulk, deleteOldGames } = require('./storage');
const { postGameToWebhook } = require('./webhook');

// The big boss function that runs the whole show
async function checkAndPostGames() {
    console.log(`[${new Date().toLocaleString()}] Sniffing around the internet for free games...`);
    const games = await fetchFreeGames();
    if (!games || !Array.isArray(games)) return;

    // Clean out old games so we can send reminders!
    const reminderDays = parseInt(process.env.REMINDER_DAYS || '7', 10);
    await deleteOldGames(reminderDays);

    // Grab the massive list of games we already snitched about
    const postedGames = await loadPostedGames();
    const isFirstRun = postedGames.length === 0;
    let newGamesCount = 0;

    // Let's sort this mess out
    const newGamesToPost = [];
    const initialRunGamesToSave = [];

    // Grab ignored platforms from environment
    const ignoredPlatforms = (process.env.IGNORED_PLATFORMS || '')
        .toLowerCase()
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        
        // Skip games from ignored platforms
        const gamePlatforms = (game.platforms || '').toLowerCase();
        if (ignoredPlatforms.some(ignored => gamePlatforms.includes(ignored))) {
            continue;
        }

        if (!postedGames.includes(String(game.id))) {
            if (isFirstRun) {
                // On the very first run, we post the single newest game just to prove it works
                if (i === 0) {
                    newGamesToPost.push(game);
                } else {
                    initialRunGamesToSave.push(game.id);
                }
            } else {
                newGamesToPost.unshift(game); // Put older games first so the timeline makes sense
            }
        }
    }

    if (isFirstRun) {
        console.log(`First run complete! Successfully hid ${initialRunGamesToSave.length} old giveaways under the rug, but posting the newest one dynamically.`);
        await savePostedGamesBulk(initialRunGamesToSave);
        // We purposefully don't 'return' here so it continues to post that 1 game!
    }

    if (newGamesToPost.length === 0) {
        console.log('No new games. Time to touch grass.');
        return;
    }

    // Don't anger the Discord rate limit gods (max 2 at once)
    const maxToPost = Math.min(newGamesToPost.length, 2);

    for (let i = 0; i < maxToPost; i++) {
        const game = newGamesToPost[i];
        const success = await postGameToWebhook(game);

        // Only etch it into the DB if Discord actually accepted it
        if (success) {
            await savePostedGame(game.id);
            newGamesCount++;
        }

        await new Promise(resolve => setTimeout(resolve, 2000)); // Chill for 2 seconds
    }

    console.log(`Mission accomplished. Shot ${newGamesCount} new games into the server.`);
}

// Fire up the engines!
console.log('Free Games Webhook script has awakened!');

// Wrap startup in an async function so we can wait for the DB
(async () => {
    await initDB(); // Wait for DB to flex its muscles

    // Do a vibe check immediately on startup
    await checkAndPostGames();

    // Set an alarm to do this all over again every 30 minutes
    cron.schedule('*/30 * * * *', () => {
        checkAndPostGames();
    });
    console.log('Alarm set! See you in 30 minutes.');
})();