
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby1aXuNqebDLmBdQLOpK4G9o2K9EVnnAyOxyP4BkaGp5Tg5kO-t1DWBDGguw3NOaOKZ/exec';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const users = {
  'youssifhouty313': 'houty313',
  'beshir21': 'beshir21',
  'malakhamed4': 'micky123',
  'hanashrar1': 'shrara123',
  'farahayman3': 'farah123',
  'razanokasha6': 'okasha123'
};

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

/* -------- LIVE DASHBOARD CLIENTS (SSE) -------- */
const dashboardClients = new Set();

function broadcastRoom207() {
  const message = `data: ${JSON.stringify(rooms['207'])}\n\n`;

  for (const client of dashboardClients) {
    try {
      client.write(message);
    } catch (error) {
      dashboardClients.delete(client);
    }
  }
}

/* -------- HOME -------- */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

/* -------- ROOMS -------- */
app.get('/rooms', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(rooms);
});

app.get('/room/:id', (req, res) => {
  if (req.params.id !== '207') {
    return res.status(404).json({ message: 'Only Room 207 is available' });
  }

  res.set('Cache-Control', 'no-store');
  res.json(rooms['207']);
});

/* -------- REAL-TIME EVENTS -------- */
app.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.flushHeaders?.();
  res.write(`data: ${JSON.stringify(rooms['207'])}\n\n`);

  dashboardClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    dashboardClients.delete(res);
  });
});

/* -------- CAMERA MOTION UPDATE -------- */
app.post('/room/207/motion', (req, res) => {
  const motion = req.body?.motion;

  if (typeof motion !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'motion must be true or false'
    });
  }

  rooms['207'].motion = motion ? 'Motion detected' : 'No motion';

  console.log(`[Room 207] ${rooms['207'].motion}`);

  broadcastRoom207();

  res.json({ success: true, room: '207', motion });
});

/* -------- PATIENT SENSOR UPDATE -------- */
app.post('/room/:id', async (req, res) => {
  if (req.params.id !== '207') {
    return res.status(404).json({ message: 'Only Room 207 is available' });
  }

  const d = req.body || {};
  const old = rooms['207'];

  const newData = {
    id: '207',
    room: '207',
    name: d.name ?? old.name,
    hr: d.hr ?? old.hr,
    spo2: d.spo2 ?? old.spo2,
    bodyTemp: d.bodyTemp ?? old.bodyTemp,
    water: d.water ?? old.water,
    ecgStatus: d.ecgStatus ?? d.ecg_status ?? d.rhythm ?? d.ecg ?? old.ecgStatus,
    motion: d.motion ?? d.motionStatus ?? d.motion_status ?? old.motion,
    status: d.status ?? old.status
  };

  Object.assign(old, newData);
  broadcastRoom207();

  const snapshot = JSON.stringify(newData);

  if (snapshot !== lastSentData) {
    try {
      const response = await axios.post(GOOGLE_SCRIPT_URL, newData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000
      });

      console.log('Google Sheets response:', response.data);
      lastSentData = snapshot;
    } catch (error) {
      console.error('Google Sheets error:', error.message);
    }
  }

  res.status(200).send('OK');
});

/* -------- INVALID JSON HANDLER -------- */
app.use((err, req, res, next) => {
  console.error('Request error:', err.message);

  if (res.headersSent) return next(err);

  res.status(400).json({
    success: false,
    message: 'Invalid request data'
  });
});

/* -------- START SERVER -------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ICU server running on port ${PORT}`);
  console.log('Room 207 only; SSE enabled at /events');
});
