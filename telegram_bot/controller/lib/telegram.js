const { axiosInstance } = require('./axios');
const { queryBrianAI } = require('./brian-utils');

async function sendMessage(messageObj, messageText) {
    try {
        const result = await axiosInstance.get('sendMessage', {
            chat_id: messageObj.chat.id,
            text: messageText,
        });
        console.log('Message sent successfully:', messageText);
        return result;
    } catch (error) {
        console.error('Send Message Error:', error.response?.data || error.message);
        throw error;
    }
}

async function handleMessage(messageObj) {
    try {
        if (!messageObj) {
            console.log('No message object received');
            return;
        }

        const messageText = messageObj.text || '';
        console.log('Received message:', messageText);
        
        if (messageText.charAt(0) === '/') {
            const command = messageText.split(' ')[0].substring(1);
            console.log('Processing command:', command);
            
            switch (command) {
                case 'start':
                    return await sendMessage(messageObj, 'Hello! Welcome to the StrkFInder bot. You can type /help for more info and know about more commands.');
                case 'help':
                    return await sendMessage(messageObj, 'This is a help message.');
                case 'ask':
                    const query = messageText.split(' ').slice(1).join(' ');
                    console.log('Processing ask command with query:', query);
                    const response = await queryBrianAI(query);
                    return await sendMessage(messageObj, response);
                case 'stop':
                    console.log('User requested to stop bot:', messageObj.chat.id);
                    return await sendMessage(messageObj, 'Goodbye! If you want to use the bot again, just send /start.');
                default:
                    return await sendMessage(messageObj, 'Invalid command. Please try again.');
            }
        } else {
            return await sendMessage(messageObj, `${messageText}\nHow can I help You today?`);
        }
    } catch (error) {
        console.error('Handle Message Error:', error.response?.data || error.message);
        throw error;
    }
}

async function handleChatMemberUpdate(update) {
    const status = update.new_chat_member.status;
    const chatId = update.chat.id;
    const userId = update.from.id;
    const username = update.from.username || 'Unknown';

    console.log(`Chat member update - Status: ${status}, Chat ID: ${chatId}, User: ${username}`);

    if (status === 'kicked' || status === 'left' || status === 'banned') {
        console.log(`User ${username} (${userId}) has stopped/blocked/deleted the bot in chat ${chatId}`);
    }
}

async function setWebhook(url) {
    try {
        const response = await axiosInstance.post('setWebhook', { url });
        console.log('Webhook setup response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Webhook Setup Error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { 
    handleMessage, 
    handleChatMemberUpdate,
    setWebhook 
};