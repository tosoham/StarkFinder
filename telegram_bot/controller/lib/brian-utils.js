const axios = require('axios');

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || '';
const BRIAN_API_URL = 'https://api.brianknows.org/api/v0/agent/knowledge';

async function queryBrianAI(prompt) {
    try {
        const response = await axios.post(
            BRIAN_API_URL,
            {
                prompt,
                kb: 'starknet_kb'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-brian-api-key': BRIAN_API_KEY,
                }
            }
        );
        return response.data.result.answer;
    } catch (error) {
        console.error('Error querying Brian AI:', error);
        return 'Sorry, I am unable to process your request at the moment.';
    }
}


module.exports = { queryBrianAI };