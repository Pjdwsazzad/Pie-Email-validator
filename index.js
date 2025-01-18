import express from 'express';
import nodemailer from 'nodemailer';
import { WebSocketServer } from 'ws';

const app = express();
const wss = new WebSocketServer({ noServer: true }); // WebSocket server setup

let wsConnection = null; // Store the WebSocket connection

// App and Developer Information
const appName = "Pie Mailer Server";
const developerName = "Pjɗw Sʌzzʌɗ";  // Developer's name

app.use(express.static('public'));  // Serve static files from the 'public' directory
app.use(express.json());

// WebSocket: Handle real-time logging to frontend
wss.on('connection', (ws) => {
  wsConnection = ws; // Store the current WebSocket connection

  // Send connection info to frontend only once
  if (wsConnection) {
    wsConnection.send('Client connected to Pie Mailer Server\n🛠️ Developed by: Pjɗw Sʌzzʌɗ');
  }

  ws.on('message', (message) => {
    console.log('Received from frontend: ', message);
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected from server');
    if (wsConnection) {
      wsConnection.send('❌ Client disconnected from server');
    }
    wsConnection = null; // Clear the connection when the WebSocket disconnects
  });
});

// Email Validator function using SMTP
const validateEmail = async (email) => {
  const smtpTransport = nodemailer.createTransport({
    host: 'mail6.serv00.com', // Replace with your SMTP server
    port: 587, // SMTP port
    secure: false, // TLS
    auth: {
      user: 'adam@p2ilab.com', // Your SMTP server email
      pass: 'Gte232555@#', // Your SMTP server password
    },
  });

  if (wsConnection) {
    wsConnection.send(`Validating ${email}...`);
    console.log(`Validating email: ${email}`);
  }

  try {
    const verificationResult = await smtpTransport.verify();
    if (verificationResult) {
      if (wsConnection) {
        wsConnection.send(`Email validation successful: ${email}`);
      }
      console.log(`Email validation successful: ${email}`);
      return email;
    }
  } catch (error) {
    if (wsConnection) {
      wsConnection.send(`Email validation failed for ${email}: ${error.message}`);
    }
    console.error(`Email validation failed for ${email}: ${error.message}`);
    return null;
  }
};

// Handle the email validation request
app.post('/validate', async (req, res) => {
  const { email } = req.body;
  const validEmails = [];
  const invalidEmails = [];

  const emailAddresses = email.split('\n').map(e => e.trim());

  for (const email of emailAddresses) {
    console.log(`Processing email: ${email}`);
    const validEmail = await validateEmail(email);
    if (validEmail) {
      validEmails.push(validEmail);
    } else {
      invalidEmails.push(email);
    }
  }

  console.log('Email validation complete');
  res.json({ validEmails, invalidEmails });
});

// WebSocket server upgrade handler
app.server = app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
