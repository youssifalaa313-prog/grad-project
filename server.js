const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();

/* -------- GOOGLE SCRIPT URL -------- */
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTl-roTAKEH3-nqrXiYSAjVhyd2fB_lfwpyZ3V9KDgI8Ed5zbVjImKrPFI_GTyUx7r/exec";

/* -------- MIDDLEWARE -------- */
app.use(cors());
app.use(express.json());

/* -------- ICU DATA -------- */
let rooms = {
  101: { name:'Ahmed Ali', hr:85, spo2:97, bodyTemp:36.9, humidity:55, water:70, status:'Normal' },
  102: { name:'Mohamed Hassan', hr:120, spo2:90, bodyTemp:39, humidity:65, water:40, status:'Critical' },
  103: { name:'Omar Khaled', hr:100, spo2:95, bodyTemp:37.5, humidity:58, water:60, status:'Warning' }
};

/* -------- TEST SERVER -------- */
app.get('/', (req, res) => {
  res.send("Server working 🚀");
});

/* -------- UPDATE FROM ESP -------- */
app.post('/room/:id', (req, res) => {
  const id = req.params.id;
  const d = req.body;

  rooms[id] = {
    name: d.name || "Unknown",
    hr: d.hr || 0,
    spo2: d.spo2 || 0,
    bodyTemp: d.bodyTemp ?? 0,
    humidity: d.humidity ?? 0,
    water: d.water ?? 0,
    status: d.status || "Normal"
  };

  console.log("UPDATED:", rooms[id]);
  res.send("OK");
});

/* -------- SEND TO GOOGLE SHEETS FUNCTION -------- */
async function sendToGoogleSheets() {
  try {
    for (let roomId in rooms) {
      const r = rooms[roomId];

      const data = {
        room: roomId,
        name: r.name,
        hr: r.hr,
        spo2: r.spo2,
        bodyTemp: r.bodyTemp,
        humidity: r.humidity,
        water: r.water,
        status: r.status
      };

      const response = await axios.post(GOOGLE_SCRIPT_URL, data, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      console.log(`✅ Sent room ${roomId}`, response.data);
    }

  } catch (err) {
    console.log("❌ Error sending:", err.message);
  }
}

/* -------- MANUAL TEST ROUTE -------- */
app.get('/test-send', async (req, res) => {
  await sendToGoogleSheets();
  res.send("✅ Sent to Google Sheets");
});

/* -------- AUTO EVERY 6 MIN -------- */
cron.schedule("*/6 * * * *", () => {
  console.log("⏱ Sending data to Google Sheets...");
  sendToGoogleSheets();
});

/* -------- SERVER -------- */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
