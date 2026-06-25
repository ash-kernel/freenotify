const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialize the table
async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS posted_games (
                id INT PRIMARY KEY,
                posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }
}

// Load all posted game IDs from the database
async function loadPostedGames() {
    try {
        const res = await pool.query('SELECT id FROM posted_games');
        return res.rows.map(row => row.id);
    } catch (error) {
        console.error('Error loading from DB:', error);
        return [];
    }
}

// Save a single game ID to the database
async function savePostedGame(gameId) {
    try {
        await pool.query('INSERT INTO posted_games (id) VALUES ($1) ON CONFLICT DO NOTHING', [gameId]);
    } catch (error) {
        console.error('Error saving to DB:', error);
    }
}

// Bulk save multiple game IDs (used for initial run)
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
        console.error('Error bulk saving to DB:', error);
    }
}

// Ensure the table exists on startup
initDB();

module.exports = {
    loadPostedGames,
    savePostedGame,
    savePostedGamesBulk
};
