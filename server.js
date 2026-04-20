const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

/* -------- GOOGLE SCRIPT URL -------- */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTl-roTAKEH3-nqrXiYSAjVhyd2fB_lfwpyZ3V9KDgI8Ed5zbVjImKrPFI_GTyUx7r/exec";

/* -------- MIDDLEWARE -------- */
app.use(cors());
app.use(express.json());
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

/* -------- LOGIN ROUTE -------- */
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (users[username] && users[username] === password) {
    return res.json({ success: true });
  }

  res.json({ success: false });
});

/* -------- ICU DATA -------- */
let rooms = {};

/* -------- TEST -------- */
app.get('/', (req, res) => {
  res.send("Server working 🚀");
});

/* -------- PING (for UptimeRobot) -------- */
app.get('/ping', (req, res) => {
  res.status(200).send("OK");
});

/* -------- GET ALL ROOMS -------- */
app.get('/rooms', (req, res) => {
  res.json(rooms);
});

/* -------- GET SINGLE ROOM -------- */
app.get('/room/:id', (req, res) => {
  const id = req.params.id;

  if (!rooms[id]) {
    return res.json({ message: "No data yet" });
  }

  res.json(rooms[id]);
});

/* -------- UPDATE FROM ESP + SEND TO GOOGLE SHEETS -------- */
app.post('/room/:id', async (req, res) => {
  const id = req.params.id;
  const d = req.body;

  const newData = {
    room: id,
    name: d.name || "Unknown",
    hr: d.hr || 0,
    spo2: d.spo2 || 0,
    bodyTemp: d.bodyTemp ?? 0,
    humidity: d.humidity ?? 0,
    water: d.water ?? 0,
    status: d.status || "Normal"
  };

  // save locally
  rooms[id] = newData;

  console.log("UPDATED:", newData);

  // 🔥 send instantly to Google Sheets
  try {
    const response = await axios.post(GOOGLE_SCRIPT_URL, newData, {
      headers: { "Content-Type": "application/json" }
    });

    console.log(`✅ Sent room ${id} to Google Sheets`, response.data);
  } catch (err) {
    console.log("❌ Error sending:", err.message);
  }

  res.send("OK");
});

/* -------- SERVER -------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
