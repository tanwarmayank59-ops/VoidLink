const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve all files (index.html, guide.html, etc.)
app.use(express.static(__dirname));

// open the game
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// multiplayer logic
let players = {};

io.on("connection", (socket) => {
  console.log("Player joined:", socket.id);

  players[socket.id] = {
    x: Math.random() * 800,
    y: Math.random() * 600
  };

  socket.emit("currentPlayers", players);
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("move", (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
    }
  });

  socket.on("disconnect", () => {
    console.log("Player left:", socket.id);
    delete players[socket.id];
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});