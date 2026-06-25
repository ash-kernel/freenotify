const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Wake up the mighty CockroachDB
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posted_games (
                id INT PRIMARY KEY,
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database flexed its muscles and is ready.');
    } catch (error) {
        console.error('The database tripped over its own shoelaces:', error);
    }
}

// Dig up all the game IDs we already spammed about
async function loadPostedGames() {
    try {
        const res = await pool.query('SELECT id FROM posted_games');
        return res.rows.map(row => row.id);
    } catch (error) {
        console.error('DB refused to hand over the goodies:', error);
        return [];
    }
}

// Slap a single game ID into the database forever
async function savePostedGame(gameId) {
    try {
        await pool.query('INSERT INTO posted_games (id) VALUES ($1) ON CONFLICT DO NOTHING', [gameId]);
    } catch (error) {
        console.error('Failed to shove game into DB:', error);
    }
}

// Dump a truckload of game IDs into the DB so we don't spam the server on the first run
async function savePostedGamesBulk(gameIds) {
    if (gameIds.length === 0) return;
    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const id of gameIds) {
                await client.query('INSERT INTO posted_games (id) VALUES ($1) ON CONFLICT DO NOTHING', [id]);
            }
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('The truck crashed while bulk saving:', error);
    }
}

// Make sure the table exists before we do anything crazy
// Clean up games older than X days so they can be posted again as reminders
async function deleteOldGames(days) {
    try {
        const result = await pool.query(`DELETE FROM posted_games WHERE posted_at < NOW() - INTERVAL '${days} days'`);
        if (result.rowCount > 0) {
            console.log(`Swept out ${result.rowCount} old games from the DB for reminders.`);
        }
    } catch (error) {
        console.error('Failed to sweep out the old games:', error);
    }
}
// We'll export this so index.js can wait for it to finish
module.exports = {
    initDB,
    loadPostedGames,
    savePostedGame,
    savePostedGamesBulk,
    deleteOldGames
};
