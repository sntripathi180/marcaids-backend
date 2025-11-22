import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { google } from 'googleapis';
import dotenv from 'dotenv';


dotenv.config();

const app = express();
app.use(cors({
    origin:process.env.CORS_ERROR || "*",
    credentials:true
}))

app.use(bodyParser.json());


const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_CREDENTIALS, 
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });


const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME;


app.post('/submit', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, message, service } = req.body;

    
    if (!firstName || !lastName || !email || !phoneNumber || !message || !service) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'USER_ENTERED',
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
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
