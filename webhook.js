const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// If you didn't set a webhook URL, how are we supposed to slide into your Discord DMs?
if (!WEBHOOK_URL || WEBHOOK_URL === 'your_discord_webhook_url_here') {
    console.error('BRUH: You forgot to put your DISCORD_WEBHOOK_URL in the .env file!');
    process.exit(1);
}

// Yeet a game straight into the Discord Webhook
async function postGameToWebhook(game) {
    const embed = {
        title: game.title,
        url: game.open_giveaway,
        description: game.description,
        color: 0x000001, // Paint it black (like my soul)
        image: {
            url: game.image
        },
        fields: [
            {
                name: 'Platforms',
                value: game.platforms,
                inline: true
            },
            {
                name: 'Worth',
                value: game.worth === 'N/A' ? 'Free' : `~~${game.worth}~~ Free`,
                inline: true
            },
            {
                name: 'Type',
                value: game.type,
                inline: true
            }
        ],
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
            console.error(`Discord rejected our beautiful embed: ${response.status} ${response.statusText}`);
        } else {
            console.log(`Successfully yeeted: ${game.title}`);
        }
    } catch (error) {
        console.error('Discord Webhook said nope:', error);
    }
}

module.exports = {
    postGameToWebhook
};
