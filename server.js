const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* DEFAULT DATA */
let rooms = {
  101: { name:'Ahmed Ali', hr:85, spo2:97, bodyTemp:36.9, humidity:55, water:70, status:'Normal' },
  102: { name:'Mohamed Hassan', hr:120, spo2:90, bodyTemp:39, humidity:65, water:40, status:'Critical' },
  103: { name:'Omar Khaled', hr:100, spo2:95, bodyTemp:37.5, humidity:58, water:60, status:'Warning' }
};

/* TEST */
app.get('/test', (req, res) => {
  res.send("Server working 🚀");
});

/* GET ALL */
app.get('/rooms', (req, res) => {
  res.json(rooms);
});

/* GET ONE */
app.get('/room/:id', (req, res) => {
  const id = req.params.id;

  if (!rooms[id]) {
    return res.json({ message: "No data yet" });
  }

  res.json(rooms[id]);
});

/* POST FROM ESP */
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🚀 Server running"));
