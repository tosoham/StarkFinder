const { axiosInstance } = require('./axios');
const { queryBrianAI } = require('./brian-utils');

function sendMessage(messageObj, messageText) {
    return axiosInstance.get('sendMessage', {
        chat_id: messageObj.chat.id,
        text: messageText,
    })
}

async function handleMessage(messageObj) {
    const messageText = messageObj.text || '';
    if (messageText.charAt(0) == '/') {
        const command = messageText.split(' ')[0].substring(1);
        switch (command) {
            case 'start':
                return sendMessage(messageObj, 'Hello! Welcome to the StrkFInder bot. You can type /help for more info and know about more commands.');
            case 'help':
                return sendMessage(messageObj, 'This is a help message.');
            case 'ask':
                return sendMessage(messageObj, await queryBrianAI(messageText.split(' ').slice(1).join(' ')));
            default:
                return sendMessage(messageObj, 'Invalid command. Please try again.');
        }
    } else {
        return sendMessage(messageObj, messageObj.text + '\nHow can I help You today?');
    }
    
}

module.exports = { handleMessage };