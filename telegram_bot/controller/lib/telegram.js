const { axiosInstance } = require('./axios');
const { TelegramBot } = require('node-telegram-bot-api');
const { Provider, ec } = require('starknet');
const { queryBrianAI, parameterExtractionBrianAI } = require('./brian-utils');

// Tracks pending command states for users
const pendingCommands = {};

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
            lines[i] = line.replace(/([^]+)/g, "$1");
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
        throw error;
    }
}

// Define command handlers with consistent structure
const commandHandlers = {
    start: {
        execute: async (messageObj) => {
            return await sendMessage(messageObj, 'Hello! Welcome to the StarkFinder bot. To initiate transaction connect to wallet by typing /connect <your_wallet_address>. You can ask the bot any query regarding starknet by just using the /ask command. You can type /help for more info and know about more commands.');
        },
        requiresInput: false
    },
    
    help: {
        execute: async (messageObj) => {
            return await sendMessage(messageObj, 'This is the help message. Available commands:\n/start - Start the bot\n/ask - Query about Starknet\n/connect - Connect your wallet\n/transactions - Process transactions\n/stop - Stop the bot');
        },
        requiresInput: false
    },
    
    ask: {
        execute: async (messageObj, input) => {
            if (!input) {
                return await sendMessage(messageObj, 'What do you want to ask? Please type your question.');
            }
            const response = await queryBrianAI(input);
            const formattedResponse = convertMarkdownToTelegramMarkdown(response);
            return await sendMessage(messageObj, formattedResponse);
        },
        requiresInput: true,
        prompt: 'What do you want to ask? Please type your question.'
    },
    
    connect: {
        execute: async (messageObj, input) => {
            if (!input) {
                return await sendMessage(messageObj, 'Please provide your wallet address.');
            }
            return await sendMessage(messageObj, `Connected to wallet address: ${input}`);
        },
        requiresInput: true,
        prompt: 'Please provide your wallet address.'
    },
    
    transactions: {
        execute: async (messageObj, input) => {
            if (!input) {
                return await sendMessage(messageObj, 'Please provide transaction details.');
            }
            const res = await parameterExtractionBrianAI(input);
            console.log(res);
        },
        requiresInput: true,
        prompt: 'Please provide transaction details.'
    },
    
    stop: {
        execute: async (messageObj) => {
            return await sendMessage(messageObj, 'Goodbye! If you want to use the bot again, just send /start.');
        },
        requiresInput: false
    }
};

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

        // Check for pending command and handle its input
        if (pendingCommands[`${chatId}_${userId}`]) {
            const pendingCommand = pendingCommands[`${chatId}_${userId}`];
            delete pendingCommands[`${chatId}_${userId}`];
            
            console.log(`Processing pending command: ${pendingCommand.command} with input: ${messageText}`);
            return await commandHandlers[pendingCommand.command].execute(messageObj, messageText);
        }

        // Handle new commands
        if (messageText.startsWith('/')) {
            const [command, ...args] = messageText.substring(1).split(' ');
            const input = args.join(' ');

            // Check if command exists
            if (!commandHandlers[command]) {
                return await sendMessage(messageObj, 'Invalid command. Type /help for available commands.');
            }

            const handler = commandHandlers[command];

            // If command requires input but none provided, store pending state
            if (handler.requiresInput && !input) {
                pendingCommands[`${chatId}_${userId}`] = {
                    command: command,
                    timestamp: Date.now()
                };
                return await sendMessage(messageObj, handler.prompt);
            }

            // Execute command
            return await handler.execute(messageObj, input);
        } else {
            return await sendMessage(messageObj, 'Unrecognized input. Use /help for available commands.');
        }
    } catch (error) {
        console.error('Handle Message Error:', error.response?.data || error.message);
        return await sendMessage(messageObj, 'An error occurred while processing your request. Please try again.');
    }
}

// Other utility functions remain the same
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