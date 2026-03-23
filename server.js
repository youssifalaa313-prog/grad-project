const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// 🔥 ICU DATA (fake but ready for ESP)
let rooms = {
  "101": { name: "Youssif", hr: 72, spo2: 98, temp: 37, bp: "120/80", status: "Normal" },
  "102": { name: "Malak", hr: 85, spo2: 96, temp: 37.2, bp: "130/85", status: "Warning" },
  "103": { name: "Hana", hr: 68, spo2: 99, temp: 36.8, bp: "118/78", status: "Normal" },
  "104": { name: "Farah", hr: 95, spo2: 94, temp: 37.6, bp: "140/90", status: "Warning" },
  "105": { name: "Razan", hr: 110, spo2: 90, temp: 38.2, bp: "160/100", status: "Critical" }
};

// 📡 GET all rooms
app.get('/rooms', (req, res) => {
  res.json(rooms);
});

// 📡 GET single room
app.get('/room/:id', (req, res) => {
  res.json(rooms[req.params.id]);
});

// 📡 UPDATE room (ESP32 later)
app.post('/room/:id', (req, res) => {
  rooms[req.params.id] = req.body;
  res.send("OK");
});

// 🔥 IMPORTANT FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running...");
});