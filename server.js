import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { readFileSync, writeFileSync } from 'node:fs';

let devices = [];

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});


function getRandomSoal() {
  const soalData = JSON.parse(readFileSync('./soal.json', 'utf-8'));
  const randomIndex = Math.floor(Math.random() * soalData.length);
  return soalData[randomIndex];
}


function markSoalAsAnswered(id) {
  const soalData = JSON.parse(readFileSync('./soal.json', 'utf-8'));
  const updated = soalData.map((s) => {
    if (s.id === id) {
      return { ...s, isAnswered: true };
    }
    return s;
  });
  writeFileSync('./soal.json', JSON.stringify(updated, null, 2));
  return updated.find((s) => s.id === id);
}

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on("getsoal", () => {
    const soal = getRandomSoal();
    io.emit("showSoal", soal);
  });
  
  socket.on("clearSoal", () => {
    io.emit("showSoal", {});
  });
  // Listener baru untuk menandai soal sudah dijawab
  socket.on("markAsAnswered", (id) => {
    const updatedSoal = markSoalAsAnswered(id);
    console.log(`Soal dengan ID ${id} ditandai sebagai answered.`);
    io.emit("soalUpdated", updatedSoal); // Broadcast info ke semua klien (opsional)
  });

  socket.on("message", (msg) => {
    console.log('message: ' + msg);
    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log('user disconnected');
  });

  socket.on("refreshDevices", () => {
    devices = [];
    console.log("Refreshing connected devices...");
    io.emit("requestDevices");
  });

  socket.on("requestDevices", (slug) => {
    console.log("Requesting devices for slug:", slug);
    devices.push(slug);
    io.emit("refreshDevices", devices);
  });

  socket.on("sendJawab", (data) => {
    if (data == 'True') {
      console.log('jawab: 1' + data);
      io.emit("jawab", {
        status: 'correct',
        reason: 'benar',
        data: { foo: 123 }
      });
    } else {
      console.log('jawab: 2' + data);
      io.emit("jawab", {
        status: 'incorrect',
        reason: 'salah',
        data: { foo: 123 }
      });
    }
  });
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});