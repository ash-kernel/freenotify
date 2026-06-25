// Fetch free games from GamerPower API
async function fetchFreeGames() {
    try {
        // Fetch only full games (excludes DLCs, Beta keys, Loot, etc)
        const response = await fetch('https://www.gamerpower.com/api/giveaways?type=game');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching games from API:', error);
        return null;
    }
}

module.exports = {
    fetchFreeGames
};
