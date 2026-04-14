const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// 🔥 ICU DATA (fake but ready for ESP)
let rooms = {
  let rooms = {
  "101": { 
    name: "Youssif", 
    hr: 72, 
    spo2: 98, 
    bodyTemp: 37, 
    humidity: 55,
    water: 70,
    status: "Normal" 
  },
  "102": { 
    name: "Malak", 
    hr: 85, 
    spo2: 96, 
    bodyTemp: 37.2, 
    humidity: 60,
    water: 65,
    status: "Warning" 
  }
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
