
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

/* -------- GOOGLE SHEETS -------- */
const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby1aXuNqebDLmBdQLOpK4G9o2K9EVnnAyOxyP4BkaGp5Tg5kO-t1DWBDGguw3NOaOKZ/exec';

/* -------- MIDDLEWARE -------- */
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

/* -------- LOGIN USERS -------- */
const users = {
  'youssifhouty313': 'houty313',
  'beshir21': 'beshir21',
  'malakhamed4': 'micky123',
  'hanashrar1': 'shrara123',
  'farahayman3': 'farah123',
  'razanokasha6': 'okasha123'
};

/* -------- ROOM 207 ONLY -------- */
const rooms = {
  '207': {
    id: '207',
    room: '207',
    name: '-',
    hr: null,
    spo2: null,
    bodyTemp: null,
    water: null,
    ecgStatus: 'Awaiting data',
    motion: 'Awaiting data',
    status: 'No Data'
  }
};

let lastSentData = null;

/* -------- HOME -------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

/* -------- SERVER HEALTH -------- */
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

/* -------- GET ALL ROOMS -------- */
app.get('/rooms', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(rooms);
});

/* -------- GET ROOM 207 -------- */
app.get('/room/:id', (req, res) => {
  if (req.params.id !== '207') {
    return res.status(404).json({
      message: 'Only Room 207 is available'
    });
  }

  res.set('Cache-Control', 'no-store');
  return res.json(rooms['207']);
});

/* -------- UPDATE MOTION FROM ESP32-CAM -------- */
app.post('/room/207/motion', (req, res) => {
  const motion = req.body?.motion;

  if (typeof motion !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Send motion as true or false'
    });
  }

  rooms['207'].motion = motion
    ? 'Motion detected'
    : 'No motion';

  console.log(
    `[Room 207] Camera: ${rooms['207'].motion}`
  );

  return res.json({
    success: true,
    room: '207',
    motion: motion,
    motionStatus: rooms['207'].motion
  });
});

/* -------- UPDATE PATIENT READINGS FROM ESP32 -------- */
app.post('/room/:id', async (req, res) => {
  if (req.params.id !== '207') {
    return res.status(404).json({
      success: false,
      message: 'Only Room 207 is available'
    });
  }

  const d = req.body || {};
  const old = rooms['207'];

  // Preserve fields that the sending device does not include.
  const newData = {
    id: '207',
    room: '207',
    name: d.name ?? old.name,
    hr: d.hr ?? old.hr,
    spo2: d.spo2 ?? old.spo2,
    bodyTemp: d.bodyTemp ?? old.bodyTemp,
    water: d.water ?? old.water,
    ecgStatus:
      d.ecgStatus ??
      d.ecg_status ??
      d.rhythm ??
      d.ecg ??
      old.ecgStatus,
    motion:
      d.motion ??
      d.motionStatus ??
      d.motion_status ??
      old.motion,
    status: d.status ?? old.status
  };

  Object.assign(old, newData);

  console.log('[Room 207] Patient readings updated');

  // Send changed readings to Google Sheets.
  const snapshot = JSON.stringify(newData);
  const unchanged = lastSentData === snapshot;

  if (!unchanged) {
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
      lastSentData = snapshot;
    } catch (error) {
      console.error(
        'Google Sheets error:',
        error.response?.data || error.message
      );
    }
  } else {
    console.log('Google Sheets: unchanged readings skipped');
  }

  return res.status(200).send('OK');
});

/* -------- INVALID JSON HANDLER -------- */
app.use((err, req, res, next) => {
  console.error('Request error:', err.message);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(400).json({
    success: false,
    message: 'Invalid request data'
  });
});

/* -------- START SERVER -------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ICU server running on port ${PORT}`);
  console.log('Configured room: 207 only');
});
