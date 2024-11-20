import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MY_TOKEN = process.env.MY_TOKEN;
const NGROK_URL = process.env.NGROK_URL; // e.g., "https://xxxx-xx-xx-xxx-xx.ngrok.io"

async function setupWebhook() {
  try {
    const webhookUrl = `${NGROK_URL}/api/tg-bot`;
    const response = await axios.post(
      `https://api.telegram.org/bot${MY_TOKEN}/setWebhook`,
      {
        url: webhookUrl,
        allowed_updates: ["message", "callback_query", "my_chat_member"]
      }
    );

    console.log('Webhook setup response:', response.data);
  } catch (error) {
    console.error('Error setting up webhook:', error);
  }
}

setupWebhook();
