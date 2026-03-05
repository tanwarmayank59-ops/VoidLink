const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

const MAP = 2000;
const MAX_ORBS = 120;
const BOT_COUNT = 6;

let rooms = {};
let players = {};
let orbs = [];
let bots = [];

function randomPos() {
  return Math.random() * MAP;
}

function generateRoomCode() {
  return Math.random().toString(36).substring(2,6).toUpperCase();
}

function spawnOrb() {
  orbs.push({
    x: randomPos(),
    y: randomPos()
  });
}

for(let i=0;i<MAX_ORBS;i++) spawnOrb();

function spawnBot(){
  bots.push({
    id:"bot"+Math.random(),
    x:randomPos(),
    y:randomPos(),
    score:0
  });
}

for(let i=0;i<BOT_COUNT;i++) spawnBot();

io.on("connection",socket=>{

  players[socket.id]={
    x:randomPos(),
    y:randomPos(),
    score:0
  };

  socket.emit("init",{
    players,
    orbs,
    bots,
    map:MAP
  });

  socket.on("create_room",()=>{
    const code = generateRoomCode();
    rooms[code]={players:[]};
    socket.join(code);
    socket.emit("room_created",code);
  });

  socket.on("join_room",(code)=>{
    if(!rooms[code]){
      socket.emit("invalid_room");
      return;
    }
    socket.join(code);
  });

  socket.on("move",(data)=>{

    const p = players[socket.id];
    if(!p) return;

    p.x = data.x;
    p.y = data.y;

    for(let i=orbs.length-1;i>=0;i--){

      const o = orbs[i];
      const dx=p.x-o.x;
      const dy=p.y-o.y;

      if(Math.sqrt(dx*dx+dy*dy)<20){
        p.score++;
        orbs.splice(i,1);
        spawnOrb();
      }

    }

    socket.broadcast.emit("player_move",{
      id:socket.id,
      x:p.x,
      y:p.y,
      score:p.score
    });

  });

  socket.on("disconnect",()=>{
    delete players[socket.id];
    io.emit("player_left",socket.id);
  });

});

setInterval(()=>{

  bots.forEach(bot=>{
    bot.x+=Math.random()*20-10;
    bot.y+=Math.random()*20-10;
  });

},100);

server.listen(PORT,()=>{
  console.log("VoidLink running on port "+PORT);
});