require('dotenv').config();
const cron = require('node-cron');
const { fetchFreeGames } = require('./api');
const { loadPostedGames, savePostedGame, savePostedGamesBulk } = require('./storage');
const { postGameToWebhook } = require('./webhook');

// The big boss function that runs the whole show
async function checkAndPostGames() {
    console.log(`[${new Date().toLocaleString()}] Sniffing around the internet for free games...`);
    const games = await fetchFreeGames();
    if (!games || !Array.isArray(games)) return;

    // Grab the massive list of games we already snitched about
    const postedGames = await loadPostedGames();
    const isFirstRun = postedGames.length === 0;
    let newGamesCount = 0;

    // Let's sort this mess out
    const newGamesToPost = [];
    const initialRunGamesToSave = [];

    for (const game of games) {
        if (!postedGames.includes(game.id)) {
            if (isFirstRun) {
                // First time running? Shove them all in the DB so we don't accidentally nuke the Discord server
                initialRunGamesToSave.push(game.id);
            } else {
                newGamesToPost.unshift(game); // Put older games first so the timeline makes sense
            }
        }
    }

    if (isFirstRun) {
        console.log(`First run complete! Successfully hid ${games.length} old giveaways under the rug.`);
        await savePostedGamesBulk(initialRunGamesToSave);
        return;
    }

    if (newGamesToPost.length === 0) {
        console.log('No new games. Time to touch grass.');
        return;
    }

    // Don't anger the Discord rate limit gods (max 10 at once)
    const maxToPost = Math.min(newGamesToPost.length, 10);

    for (let i = 0; i < maxToPost; i++) {
        const game = newGamesToPost[i];
        await postGameToWebhook(game);
        
        // Etch it into the DB so we never speak of it again
        await savePostedGame(game.id);
        
        newGamesCount++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // Chill for 2 seconds
    }

    console.log(`Mission accomplished. Shot ${newGamesCount} new games into the server.`);
}

// Fire up the engines!
console.log('Free Games Webhook script has awakened!');

// Do a vibe check immediately on startup
checkAndPostGames();

// Set an alarm to do this all over again every 10 minutes
cron.schedule('*/10 * * * *', () => {
    checkAndPostGames();
});
console.log('Alarm set! See you in 10 minutes.');
