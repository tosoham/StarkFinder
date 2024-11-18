const { axiosInstance } = require('./axios');
const { TelegramBot } = require('node-telegram-bot-api');
const { Provider, ec } = require('starknet');
const { queryBrianAI, parameterExtractionBrianAI } = require('./brian-utils');

const pendingInputs = {}; // Tracks users waiting to complete commands

function convertMarkdownToTelegramMarkdown(text) {
    let lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith("# ")) {
            lines[i] = `*${line.slice(2)}*`;
        } else if (line.startsWith("## ")) {
            lines[i] = `*${line.slice(3)}*`;
        } else if (line.startsWith("### ")) {
            lines[i] = `\`${line.slice(4)}\``;
        } else if (line.startsWith("#### ")) {
            lines[i] = `\`${line.slice(4)}\``;
        } else {
            lines[i] = line.replace(/`([^`]+)`/g, "`$1`");
        }
    }
    return lines.join("\n");
}

async function sendMessage(messageObj, messageText) {
    try {
        if (!messageObj || !messageObj.chat || !messageObj.chat.id) {
            throw new Error('Invalid message object or missing chat ID.');
        }
        if (!messageText || messageText.trim() === '') {
            throw new Error('Cannot send an empty message.');
        }

        const result = await axiosInstance.get('sendMessage', {
            chat_id: messageObj.chat.id,
            text: messageText,
            parse_mode: 'Markdown',
        });
        console.log('Message sent successfully:', messageText);
        return result;
    } catch (error) {
        console.error('Send Message Error:', error.response?.data || error.message);
        throw error; // Ensure the calling function knows an error occurred
    }
}

// Command handlers for dynamic execution
const commandHandlers = {
    start: async (messageObj) => {
        return await sendMessage(messageObj, 'Hello! Welcome to the StarkFinder bot. To initiate transaction connect to wallet by typing /connect <your/_wallet/_address>. You can ask the bot any query regarding starknet by just using the /ask command. You can type /help for more info and know about more commands.');
    },
    help: async (messageObj) => {
        return await sendMessage(messageObj, 'This is the help message. Use /connect <wallet> to connect or /ask to query Starknet.');
    },
    ask: async (messageObj, input) => {
        const query = input || 'What do you want to ask? Please type your question.';
        if (!input) {
            pendingInputs[messageObj.chat.id] = { command: 'ask' };
            return await sendMessage(messageObj, query);
        }
        const response = await queryBrianAI(input);
        const formattedResponse = convertMarkdownToTelegramMarkdown(response);
        return await sendMessage(messageObj, formattedResponse);
    },
    connect: async (messageObj, input) => {
        const walletAddress = input;
        if (!walletAddress) {
            pendingInputs[messageObj.chat.id] = { command: 'connect' };
            return await sendMessage(messageObj, 'Please provide your wallet address.');
        }
        return await sendMessage(messageObj, `Connected to wallet address: ${walletAddress}`);
    },
    transactions: async (messageObj, input) => {
        if (!input) {
            pendingInputs[messageObj.chat.id] = { command: 'transactions' };
            return await sendMessage(messageObj, 'Please provide transaction details.');
        }
        const res = await parameterExtractionBrianAI(input);
        return await sendMessage(messageObj, `Transaction processed: ${JSON.stringify(res)}`);
    },
    stop: async (messageObj) => {
        return await sendMessage(messageObj, 'Goodbye! If you want to use the bot again, just send /start.');
    },
};

const pendingQueries = {}; 

async function handleMessage(messageObj) {
    try {
        if (!messageObj) {
            console.log('No message object received');
            return;
        }

        const chatId = messageObj.chat.id;
        const userId = messageObj.from.id;
        const messageText = messageObj.text?.trim() || '';

        console.log('Received message:', messageText);

        if (pendingQueries[chatId] && pendingQueries[chatId][userId]) {
            const query = messageText; 
            delete pendingQueries[chatId][userId];

            console.log('Processing follow-up question:', query);
            let response = await queryBrianAI(query);
            response = convertMarkdownToTelegramMarkdown(response);
            return await sendMessage(messageObj, response);
        }

        if (messageText.startsWith('/')) {
            const [command, ...args] = messageText.substring(1).split(' ');
            const input = args.join(' ');

            switch (command) {
                case 'ask':
                    if (!input) {
                        console.log('Prompting user for follow-up question...');
                        if (!pendingQueries[chatId]) pendingQueries[chatId] = {};
                        pendingQueries[chatId][userId] = true;

                        return await sendMessage(
                            messageObj,
                            'What do you want to ask? Please type your question.'
                        );
                    } else {
                        console.log('Processing ask command with input:', input);
                        let response = await queryBrianAI(input);
                        response = convertMarkdownToTelegramMarkdown(response);
                        return await sendMessage(messageObj, response);
                    }

                case 'start':
                    return await sendMessage(
                        messageObj,
                        'Hello! Welcome to the StarkFinder bot. To initiate transaction connect to wallet by typing /connect <your/_wallet/_address>. You can ask the bot any query regarding starknet by just using the /ask command. You can type /help for more info and know about more commands.'
                    );

                case 'help':
                    return await sendMessage(
                        messageObj,
                        'This is a help message with available commands: /start, /ask, /connect.'
                    );

                case 'connect':
                    const walletAddress = input;
                    return await sendMessage(
                        messageObj,
                        walletAddress
                            ? `Connected to wallet address: ${walletAddress}`
                            : 'Please provide a wallet address with /connect <wallet_address>.'
                    );

                default:
                    return await sendMessage(
                        messageObj,
                        'Invalid command. Type /help for available commands.'
                    );
            }
        } else {
            return await sendMessage(
                messageObj,
                'Unrecognized input. Use /help for available commands.'
            );
        }
    } catch (error) {
        console.error('Handle Message Error:', error.response?.data || error.message);
        return await sendMessage(
            messageObj,
            'An error occurred while processing your request. Please try again.'
        );
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
    setWebhook,
};
