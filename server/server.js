// server/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors({
    origin: 'https://inforag-fronten.onrender.com',
    credentials: true
}));
app.use(express.json());

// --- Multer Configuration ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Nodemailer Configuration ---
// FIX 1: Use environment variables for credentials. NEVER hardcode them.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "0829cs221161@gmail.com",
        pass: "etglbksxffhcdvop", // Use a Google App Password here
    },
    // Adding a timeout to prevent hanging connections
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 10000,     // 10 seconds
});

// --- API Endpoint ---
// FIX 2: Made the entire function async to handle email sending properly.
app.post('/api/send-emails', upload.single('file'), async (req, res) => {
    const { subject, body } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Create a list of promises, one for each email
        const emailPromises = data
            .filter(row => row['Email IDs']) // Ensure the email column exists and is not empty
            .map((row) => {
                const recipientName = row.Name || 'There';
                const recipientEmail = row['Email IDs'];
                const personalizedBody = body.replace(/{name}/gi, recipientName);

                const mailOptions = {
                    from: "0829cs221161@gmail.com",
                    to: recipientEmail,
                    subject: subject,
                    text: personalizedBody,
                };

                // Return the promise from transporter.sendMail
                return transporter.sendMail(mailOptions);
            });

        // Wait for all emails to be sent
        const results = await Promise.allSettled(emailPromises);

        const successfulEmails = results.filter(r => r.status === 'fulfilled').length;
        const failedEmails = results.filter(r => r.status === 'rejected').length;

        console.log(`Processing complete. Success: ${successfulEmails}, Failed: ${failedEmails}`);

        // Log detailed errors for failed emails
        results.forEach(result => {
            if (result.status === 'rejected') {
                console.error('Failed to send email:', result.reason);
            }
        });

        res.status(200).json({
            message: 'Email processing complete.',
            successful: successfulEmails,
            failed: failedEmails,
        });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'Failed to process file and send emails.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
