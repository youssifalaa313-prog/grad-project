const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

app.use(cors());
app.use(express.json());

// 🔥 FORCE ROOT ROUTE
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fake data (for now)
let patientData = {
  hr: 80,
  spo2: 98,
  temp: 36.8,
  bp: "120/80",
  ecg: "Normal"
};

// simulate live data
setInterval(() => {
  patientData.hr = Math.floor(70 + Math.random() * 20);
}, 1000);

// API
app.get('/data', (req, res) => {
  res.json(patientData);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});