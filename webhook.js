const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// If you didn't set a webhook URL, how are we supposed to slide into your Discord DMs?
if (!WEBHOOK_URL || WEBHOOK_URL === 'your_discord_webhook_url_here') {
    console.error('BRUH: You forgot to put your DISCORD_WEBHOOK_URL in the .env file!');
    process.exit(1);
}

// Format end date nicely, or return a fallback string
function formatEndDate(endDate) {
    if (!endDate || endDate === 'N/A') return 'Unknown';
    const d = new Date(endDate);
    if (isNaN(d.getTime())) return 'Unknown';
    return `<t:${Math.floor(d.getTime() / 1000)}:R>`; // Discord relative timestamp
}

// Yeet a game straight into the Discord Webhook
// Returns true on success, false on failure — so the caller can decide whether to save to DB
async function postGameToWebhook(game) {
    const worthValue = (!game.worth || game.worth === 'N/A' || game.worth === '0.00 $')
        ? 'Free'
        : `~~${game.worth}~~ Free`;

    const embed = {
        title: `🎮 ${game.title}`,
        url: game.open_giveaway,
        description: game.description || 'No description available.',
        color: 0x9E02F8, // Purple — matched to logo
        thumbnail: {
            url: game.thumbnail
        },
        image: {
            url: game.image
        },
        fields: [
            {
                name: '🖥️ Platforms',
                value: game.platforms || 'Unknown',
                inline: true
            },
            {
                name: '💰 Worth',
                value: worthValue,
                inline: true
            },
            {
                name: '⏳ Ends',
                value: formatEndDate(game.end_date),
                inline: true
            }
        ],
        footer: {
            text: 'via GamerPower • Free Notify'
        },
        timestamp: new Date().toISOString()
    };

    const payload = {
        username: 'Free Notify',
        content: '||<@&1519658019842035732>||', // Sneaky little role ping hiding behind a spoiler
        embeds: [embed]
    };

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const body = await response.text();
            console.error(`Discord rejected our beautiful embed: ${response.status} ${response.statusText} — ${body}`);
            return false;
        }

        console.log(`Successfully yeeted: ${game.title}`);
        return true;
    } catch (error) {
        console.error('Discord Webhook said nope:', error);
        return false;
    }
}

module.exports = {
    postGameToWebhook
};
