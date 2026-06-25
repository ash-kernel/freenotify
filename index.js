require('dotenv').config();
const cron = require('node-cron');
const { fetchFreeGames } = require('./api');
const { loadPostedGames, savePostedGame, savePostedGamesBulk } = require('./storage');
const { postGameToWebhook } = require('./webhook');

// Main job logic
async function checkAndPostGames() {
    console.log(`[${new Date().toLocaleString()}] Checking for new free games...`);
    const games = await fetchFreeGames();
    if (!games || !Array.isArray(games)) return;

    // Load games from database asynchronously
    const postedGames = await loadPostedGames();
    const isFirstRun = postedGames.length === 0;
    let newGamesCount = 0;

    // Process from newest to oldest
    const newGamesToPost = [];
    const initialRunGamesToSave = [];

    for (const game of games) {
        if (!postedGames.includes(game.id)) {
            if (isFirstRun) {
                // Collect IDs to bulk save on initial run
                initialRunGamesToSave.push(game.id);
            } else {
                newGamesToPost.unshift(game); // Add to beginning
            }
        }
    }

    if (isFirstRun) {
        console.log(`First run setup complete. Marked ${games.length} existing giveaways as seen to prevent server spam!`);
        await savePostedGamesBulk(initialRunGamesToSave);
        return;
    }

    if (newGamesToPost.length === 0) {
        console.log('No new games found.');
        return;
    }

    const maxToPost = Math.min(newGamesToPost.length, 10);

    for (let i = 0; i < maxToPost; i++) {
        const game = newGamesToPost[i];
        await postGameToWebhook(game);
        
        // Save to DB immediately after posting
        await savePostedGame(game.id);
        
        newGamesCount++;
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`Finished checking. Posted ${newGamesCount} new games.`);
}

// Start the application
console.log('Free Games Webhook script started!');

// Run immediately on startup
checkAndPostGames();

// Schedule to run every 10 minutes
cron.schedule('*/10 * * * *', () => {
    checkAndPostGames();
});
console.log('Scheduled to check every 10 minutes.');
