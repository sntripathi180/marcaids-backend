import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// CORS setup
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());

// Parse Google service account credentials from environment
const googleCredentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

// Replace escaped newline characters
googleCredentials.private_key = googleCredentials.private_key.replace(/\\n/g, "\n");

// Google Sheets setup
const auth = new google.auth.GoogleAuth({
    credentials: googleCredentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

// Wrap server start in async function
async function startServer() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // POST endpoint to submit form data
    app.post('/submit', async (req, res) => {
        try {
            const { firstName, lastName, email, phoneNumber, message, service } = req.body;

            // Validate required fields
            if (!firstName || !lastName || !email || !phoneNumber || !message || !service) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            // console.log("🔥 Incoming Form Data:", req.body);
            // console.log("📌 Using spreadsheet ID:", SPREADSHEET_ID);
            // console.log("📌 Using sheet name:", SHEET_NAME);
            // console.log("📌 Service Account Email:", googleCredentials.client_email);

            // Append data to Google Sheet
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A1`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[
                        new Date().toLocaleString(),
                        firstName,
                        lastName,
                        email,
                        phoneNumber,
                        message,
                        service,
                    ]],
                },
            });

            res.status(200).json({ success: true, message: 'Form data added to Google Sheet!' });
        } catch (error) {
            console.error('Error writing to Google Sheet:', error);
            res.status(500).json({ success: false, message: 'Something went wrong', error });
        }
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Start the server
startServer();
