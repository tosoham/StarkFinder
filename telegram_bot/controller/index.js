const { handleMessage, handleChatMemberUpdate, setWebhook } = require('./lib/telegram');

async function handler(req, method) {
    try {
        if (method === 'GET') {
            // Use the ngrok URL passed from index.js
            const webhookUrl = req.webhookUrl;
            if (!webhookUrl) {
                throw new Error('Webhook URL not provided');
            }
            return await setWebhook(webhookUrl);
        }

        const body = req.body;
        if (!body) {
            console.error('No body received');
            return { ok: false, error: 'No body received' };
        }

        console.log('Received update:', JSON.stringify(body, null, 2));

        if (body.message) {
            await handleMessage(body.message);
            return { ok: true };
        } else if (body.my_chat_member) {
            await handleChatMemberUpdate(body.my_chat_member);
            return { ok: true };
        } else {
            console.log('No message or chat member update in update');
            return { ok: true };
        }
    } catch (error) {
        console.error('Handler Error:', error.message);
        return { 
            ok: false, 
            error: error.message 
        };
    }
}

module.exports = { handler };