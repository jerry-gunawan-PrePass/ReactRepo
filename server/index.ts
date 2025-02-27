import express from 'express';
import twilio from 'twilio';

const app = express();
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

app.post('/api/send-sms', async (req, res) => {
    try {
        const { phone, message } = req.body;
        
        await client.messages.create({
            body: message,
            to: phone,
            from: process.env.TWILIO_PHONE_NUMBER,
        });

        res.json({ success: true });
    } catch (error) {
        console.error('SMS Error:', error);
        res.status(500).json({ error: 'Failed to send SMS' });
    }
}); 