const express = require('express');
const axios = require('axios');
const PORT = process.env.PORT || 4040;
const { handler } = require('./controller');

const app = express();
app.use(express.json());

// Function to get public URL from ngrok
async function getNgrokUrl() {
    try {
        const response = await axios.get('http://localhost:4040/api/tunnels');
        const publicUrl = response.data.tunnels[0].public_url;
        console.log('Ngrok public URL:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('Error getting ngrok URL:', error.message);
        return null;
    }
}

// Setup webhook with the current ngrok URL
async function setupWebhook() {
    try {
        const ngrokUrl = await getNgrokUrl();
        if (!ngrokUrl) {
            console.error('Could not get ngrok URL. Is ngrok running?');
            return;
        }

        const webhookUrl = `${ngrokUrl}/webhook`;
        console.log('Setting up webhook with URL:', webhookUrl);
        
        const result = await handler({ 
            method: 'GET',
            webhookUrl 
        }, 'GET');
        
        console.log('Webhook setup result:', result);
    } catch (error) {
        console.error('Error setting up webhook:', error.message);
    }
}

app.post("/webhook", async (req, res) => {
    console.log('Received webhook POST request');
    const result = await handler(req, 'POST');
    res.json(result);
});

app.get("/webhook", async (req, res) => {
    console.log('Received webhook GET request');
    const result = await handler(req, 'GET');
    res.json(result);
});

// Start server and setup webhook
app.listen(PORT, async function (err) {
    if (err) {
        console.log(err);
        return;
    }
    console.log("Server listening on PORT", PORT);
    
    // Setup webhook with ngrok URL
    await setupWebhook();
});