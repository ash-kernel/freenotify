const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Ensure the webhook URL is provided
if (!WEBHOOK_URL || WEBHOOK_URL === 'your_discord_webhook_url_here') {
    console.error('ERROR: Please set your DISCORD_WEBHOOK_URL in the .env file.');
    process.exit(1);
}

// Post a single game to the Discord Webhook
async function postGameToWebhook(game) {
    const embed = {
        title: game.title,
        url: game.open_giveaway,
        description: game.description,
        color: 0x000001, // Black color
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
        content: '||<@&1519658019842035732>||',
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
            console.error(`Failed to post to webhook: ${response.status} ${response.statusText}`);
        } else {
            console.log(`Successfully posted: ${game.title}`);
        }
    } catch (error) {
        console.error('Error posting to webhook:', error);
    }
}

module.exports = {
    postGameToWebhook
};
