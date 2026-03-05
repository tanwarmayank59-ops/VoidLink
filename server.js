const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Game State
let players = {};
let orbs = []; // Added empty arrays to prevent client-side errors
let bots = [];
const MAP_SIZE = 2000;

// Initialize some random orbs
for (let i = 0; i < 50; i++) {
  orbs.push({ x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE });
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("Player joined:", socket.id);

  // Initialize player with a score
  players[socket.id] = {
    id: socket.id,
    x: Math.random() * MAP_SIZE,
    y: Math.random() * MAP_SIZE,
    score: 0
  };

  // Send initial world state to the new player
  socket.emit("init", {
    players: players,
    bots: bots,
    orbs: orbs,
    map: MAP_SIZE
  });

  // Tell others a new player joined
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      // Broadcast movement to everyone
      socket.broadcast.emit("player_move", players[socket.id]);
    }
  });

  socket.on("createRoom", () => {
    const code = generateRoomCode();
    socket.join(code);
    socket.emit("roomCreated", code);
  });

  socket.on("disconnect", () => {
    console.log("Player left:", socket.id);
    delete players[socket.id];
    io.emit("player_left", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});