const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function resetDB() {
    try {
        console.log('Connecting to the database...');
        // Drop the table entirely so the bot can rebuild it from scratch
        await pool.query('DROP TABLE IF EXISTS posted_games;');
        console.log('✅ Success! The database has been completely wiped.');
        console.log('Next time you run the bot, it will act like a fresh installation.');
    } catch (error) {
        console.error('❌ Failed to reset database:', error);
    } finally {
        await pool.end();
    }
}

resetDB();
