// Time to rob GamerPower of their precious free game data
async function fetchFreeGames() {
    try {
        // We only want the good stuff (actual games), no useless wallpaper DLCs
        const response = await fetch('https://www.gamerpower.com/api/giveaways?type=game');
        if (!response.ok) {
            throw new Error(`GamerPower hit us with a spicy error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Mission failed, we\'ll get em next time (API Error):', error);
        return null;
    }
}

module.exports = {
    fetchFreeGames
};
