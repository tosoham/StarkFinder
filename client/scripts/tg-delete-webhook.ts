import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MY_TOKEN = process.env.MY_TOKEN;

async function deleteWebhook() {
  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${MY_TOKEN}/deleteWebhook`
    );

    console.log('Webhook deletion response:', response.data);
  } catch (error) {
    console.error('Error deleting webhook:', error);
  }
}

deleteWebhook();
