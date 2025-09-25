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
// Enable CORS for frontend communication
app.use(cors({origin:'https://inforag-fronten.onrender.com',
  credentials:true}));
// Parse JSON bodies
app.use(express.json());

// --- Multer Configuration for File Upload ---
// We use memoryStorage to temporarily hold the file in memory before processing
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Nodemailer Configuration ---
// IMPORTANT: Use environment variables for security!
// For Gmail, you might need to generate an "App Password"
// https://support.google.com/accounts/answer/185833
const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service
    auth: {
        user: "0829cs221161@gmail.com",
        pass: "etglbksxffhcdvop",
    },
});

// --- API Endpoint ---
// @route   POST /api/send-emails
// @desc    Upload an excel file, parse it, and send emails
app.post('/api/send-emails', upload.single('file'), (req, res) => {
    const { subject, body } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // Parse the Excel file from the buffer
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Iterate over the data and send emails
        data.forEach((row) => {
            const recipientName = row.Name || 'There'; // Fallback if Name column is empty
            const recipientEmail = row['Email IDs']; // Access column by its name

            if (recipientEmail) {
                const personalizedBody = body.replace(/{name}/gi, recipientName);

                const mailOptions = {
                    from: "0829cs221161@gmail.com",
                    to: recipientEmail,
                    subject: subject,
                    text: personalizedBody,
                    // You can also use html: `<h1>Hello ${recipientName}</h1>`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error(`Error sending email to ${recipientEmail}:`, error);
                    } else {
                        console.log(`Email sent to ${recipientEmail}: ${info.response}`);
                    }
                });
            }
        });

        res.status(200).json({ message: 'Emails are being sent in the background.' });

    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).json({ message: 'Failed to process file and send emails.' });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
