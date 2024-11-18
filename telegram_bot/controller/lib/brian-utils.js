const axios = require('axios');

const BRIAN_API_KEY = process.env.BRIAN_API_KEY || '';
const BRIAN_API_URL_KNOWLEDGE = 'https://api.brianknows.org/api/v0/agent/knowledge';
const BRIAN_API_URL_PARAMETERS = 'https://api.brianknows.org/api/v0/agent/parameters-extraction';

async function queryBrianAI(prompt) {
    try {
        const response = await axios.post(
            BRIAN_API_URL_KNOWLEDGE,
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
        console.error('Brian AI Error:', error.response?.data || error.message);
        return 'Sorry, I am unable to process your request at the moment.';
    }
}

async function parameterExtractionBrianAI(prompt) {
    try {
        const response = await axios.post(
            BRIAN_API_URL_PARAMETERS,
            {
                prompt,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-brian-api-key': BRIAN_API_KEY,
                },
            },
        );
            return response.data.result.completion;
    } catch (error) {
        console.error('Brian AI Error:', error.response?.data || error.message);
        return 'Sorry, I am unable to process your request at the moment.';
    }
};


module.exports = { queryBrianAI, parameterExtractionBrianAI };