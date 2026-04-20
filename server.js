const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

/* -------- GOOGLE SCRIPT URL -------- */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby5kZMrQgs_eIvmTApdMdXANN5PKa6HL1o2bTDLYO3cmNpmCR9YrDmL4k6r-S8JKzcb/exec";

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

/* -------- ICU DATA (ALL ROOMS ALWAYS EXIST) -------- */
let rooms = {
  101: { name:'-', hr:0, spo2:0, bodyTemp:0, humidity:0, water:0, status:'No Data' },
  102: { name:'-', hr:0, spo2:0, bodyTemp:0, humidity:0, water:0, status:'No Data' },
  103: { name:'-', hr:0, spo2:0, bodyTemp:0, humidity:0, water:0, status:'No Data' }
};

/* -------- LAST SENT CACHE -------- */
let lastSentData = {};

/* -------- TEST -------- */
app.get('/', (req, res) => {
  res.send("Server working 🚀");
});

/* -------- PING (for uptime robot) -------- */
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

/* -------- UPDATE FROM ESP + SMART SEND -------- */
app.post('/room/:id', async (req, res) => {
  const id = req.params.id;
  const d = req.body;

  const newData = {
    room: id,
    name: d.name || "-",
    hr: d.hr || 0,
    spo2: d.spo2 || 0,
    bodyTemp: d.bodyTemp ?? 0,
    humidity: d.humidity ?? 0,
    water: d.water ?? 0,
    status: d.status || "Normal"
  };

  // update only that room
  rooms[id] = newData;

  console.log("UPDATED:", newData);

  // check if data changed
  const prev = lastSentData[id];

  const isSame =
    prev &&
    prev.hr === newData.hr &&
    prev.spo2 === newData.spo2 &&
    prev.bodyTemp === newData.bodyTemp &&
    prev.humidity === newData.humidity &&
    prev.water === newData.water &&
    prev.status === newData.status;

  if (!isSame) {
    try {
      const response = await axios.post(GOOGLE_SCRIPT_URL, newData, {
        headers: { "Content-Type": "application/json" }
      });

      console.log(`✅ Sent room ${id} to Google Sheets`, response.data);

      // save last sent data
      lastSentData[id] = newData;

    } catch (err) {
      console.log("❌ Error sending:", err.message);
    }
  } else {
    console.log("⏭ Skipped (same data)");
  }

  res.send("OK");
});

/* -------- SERVER -------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
