
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

/* -------- GOOGLE SCRIPT URL -------- */
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby1aXuNqebDLmBdQLOpK4G9o2K9EVnnAyOxyP4BkaGp5Tg5kO-t1DWBDGguw3NOaOKZ/exec";

/* -------- MIDDLEWARE -------- */
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

/* -------- USERS (LOGIN) -------- */
const users = {
  "youssifhouty313": "houty313",
  "beshir21": "beshir21",
  "malakhamed4": "micky123",
  "hanashrar1": "shrara123",
  "farahayman3": "farah123",
  "razanokasha6": "okasha123"
};

/* -------- ONLY ROOM 207 -------- */
const rooms = {
  "207": {
    id: "207",
    room: "207",
    name: "-",
    hr: null,
    spo2: null,
    bodyTemp: null,
    water: null,
    ecgStatus: "Awaiting data",
    motion: "Awaiting data",
    status: "No Data"
  }
};

/* -------- LAST DATA SENT TO GOOGLE SHEETS -------- */
let lastSentData = null;

/* -------- HOME: SERVE WEBSITE -------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* -------- HEALTH CHECK -------- */
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

/* -------- LOGIN -------- */
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username === 'string' &&
    typeof password === 'string' &&
    Object.prototype.hasOwnProperty.call(users, username) &&
    users[username] === password
  ) {
    return res.json({ success: true });
  }

  return res.status(401).json({ success: false });
});

/* -------- GET ALL ROOMS: ROOM 207 ONLY -------- */
app.get('/rooms', (req, res) => {
  res.set('Cache-Control', 'no-store');
  return res.json(rooms);
});

/* -------- GET ROOM 207 -------- */
app.get('/room/:id', (req, res) => {
  if (req.params.id !== '207') {
    return res.status(404).json({
      message: 'Room not found. Only Room 207 is available.'
    });
  }

  res.set('Cache-Control', 'no-store');
  return res.json(rooms['207']);
});

/* -------- UPDATE ROOM 207 FROM ESP32 -------- */
app.post('/room/:id', async (req, res) => {
  if (req.params.id !== '207') {
    return res.status(404).json({
      success: false,
      message: 'Only Room 207 is available.'
    });
  }

  const d = req.body || {};

  // Accept both the original and alternative field names.
  const newData = {
    id: '207',
    room: '207',
    name: d.name ?? rooms['207'].name ?? '-',
    hr: d.hr ?? null,
    spo2: d.spo2 ?? null,
    bodyTemp: d.bodyTemp ?? null,
    water: d.water ?? null,
    ecgStatus:
      d.ecgStatus ??
      d.ecg_status ??
      d.rhythm ??
      d.ecg ??
      'Awaiting data',
    motion:
      d.motion ??
      d.motionStatus ??
      d.motion_status ??
      'Awaiting data',
    status: d.status ?? 'Normal'
  };

  // Update the live data returned to the dashboard.
  Object.assign(rooms['207'], newData);

  console.log('Updated Room 207:', newData);

  // Compare data before sending it to Google Sheets.
  const isSame =
    lastSentData !== null &&
    JSON.stringify(lastSentData) === JSON.stringify(newData);

  if (!isSame) {
    try {
      const response = await axios.post(
        GOOGLE_SCRIPT_URL,
        newData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      console.log('Google Sheets response:', response.data);

      // Cache only after a successful request.
      lastSentData = { ...newData };
    } catch (error) {
      console.error(
        'Google Sheets send failed:',
        error.response?.data || error.message
      );
    }
  } else {
    console.log('Google Sheets: unchanged data, skipped.');
  }

  // The dashboard can still use readings if Sheets is unavailable.
  return res.status(200).send('OK');
});

/* -------- HANDLE INVALID JSON -------- */
app.use((err, req, res, next) => {
  if (err) {
    console.error('Request error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid request data.'
    });
  }

  next();
});

/* -------- START SERVER -------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ICU Monitoring Server running on port ${PORT}`);
  console.log('Configured room: 207 only');
});
