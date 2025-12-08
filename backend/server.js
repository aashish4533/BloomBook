const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Email Transporter Configuration
// For testing, we'll try to use Ethereal first if no real credentials are provided
let transporter;

const createTransporter = async () => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        // Use real credentials if provided
        transporter = nodemailer.createTransport({
            service: 'gmail', // Or your preferred service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        console.log('Configured with provided credentials');
    } else {
        // Fallback to Ethereal for testing
        try {
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            console.log('Configured with Ethereal Test Account');
            console.log('User:', testAccount.user);
            console.log('Pass:', testAccount.pass);
        } catch (err) {
            console.error('Failed to create Ethereal account:', err);
        }
    }
};

createTransporter();

// API Endpoint to send OTP
app.post('/api/send-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    if (!transporter) {
        return res.status(500).json({ error: 'Email transporter not initialized' });
    }

    const mailOptions = {
        from: '"BookBloom Admin" <admin@bookbloom.com>',
        to: email,
        subject: 'Your BookBloom Admin Login Code',
        text: `Your verification code is: ${otp}`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #C4A672;">BookBloom Admin Verification</h2>
        <p>Please use the following code to complete your login:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">
          ${otp}
        </div>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);

        // If using Ethereal, log the preview URL
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('Preview URL: %s', previewUrl);
            return res.json({ success: true, message: 'OTP sent', previewUrl });
        }

        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// app.listen(PORT, () => {
//     console.log(`Backend server running on http://localhost:${PORT}`);
// });

const functions = require('firebase-functions');
exports.api = functions.https.onRequest(app);
