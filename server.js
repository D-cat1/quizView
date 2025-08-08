import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { readFileSync, writeFileSync } from 'node:fs';

let devices = [];
function getTeamList() {
  return JSON.parse(readFileSync('./team.json', 'utf-8'));
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});




io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on("reqBabak", () => {
    const babakData = JSON.parse(readFileSync('./babak.json', 'utf-8'));
    const keys = Object.keys(babakData);
    io.emit("getBabak", keys);
  });

  socket.on("disconnect", () => {
    console.log('user disconnected');
  });

  socket.on("reqTeam", (key) => {
    const babakData = JSON.parse(readFileSync('./babak.json', 'utf-8'));
    const teams = babakData[key] || [];
    io.emit("getTeam", teams);
  });

  socket.on("reqPaketSoal", () => {
    const paketSoalData = JSON.parse(readFileSync('./paket_soal.json', 'utf-8'));
    const keys = Object.keys(paketSoalData);
    io.emit("getPaketSoal", keys);
  });

  socket.on("reqSoal", (key) => {
    const paketSoalData = JSON.parse(readFileSync('./paket_soal.json', 'utf-8'));
    const paket = paketSoalData[key];
    if (paket) {
      const filteredData = {
        ...paket,
        data: paket.data
          .map((soal, i) => ({ ...soal, originalIndex: i }))
          .filter(soal => soal.isAnswered === false)
      };
      io.emit("getSoal", filteredData);
    } else {
      io.emit("getSoal", {});
    }
  });

  socket.on("reqProgramSoal", (data) => {
    console.log(data)
    io.emit("getProgramSoal", data);
  });

  socket.on("unshowProgramSoal", () => {
    io.emit("unshowProgramSoal");
  });

  socket.on("reqChange", (data) => {
    io.emit("showChange", data)
  })

  socket.on("reqPoinTeam", (data) => {
    console.log("Received reqPoinTean:", data);
    const { babak, index, poin } = data;

    const babakData = JSON.parse(readFileSync('./babak.json', 'utf-8'));
    if (babakData[babak] && babakData[babak][index]) {
      babakData[babak][index].points += poin;
      writeFileSync('./babak.json', JSON.stringify(babakData, null, 2));
    }

    io.emit("displayPoin", data)
    const teams = babakData[babak] || [];
    io.emit("getTeam", teams);

  });


  socket.on("startTimer", () => {
    io.emit("getTimer")
  })

  socket.on("playEffect", (name) => {
    io.emit("playEffect", name)
  })


  socket.on("reqWinner", (babak) => {
    console.log(babak)
    const babakData = JSON.parse(readFileSync('./babak.json', 'utf-8'));
    const teams = babakData[babak] || [];
    const highest = teams.reduce((max, item) =>
      item.points > max.points ? item : max
    );
    io.emit("showWinner", highest)

  })

  socket.on("reqIsAnswered", ({ paket, index }) => {
    console.log("trigga")
    const paketSoalData = JSON.parse(readFileSync('./paket_soal.json', 'utf-8'));
    if (paketSoalData[paket] && paketSoalData[paket].data[index]) {
      paketSoalData[paket].data[index].isAnswered = true;
      writeFileSync('./paket_soal.json', JSON.stringify(paketSoalData, null, 2));
      const dtpaket = paketSoalData[paket];
      if (dtpaket) {
        const filteredData = {
          ...dtpaket,
          data: dtpaket.data
            .map((soal, i) => ({ ...soal, originalIndex: i }))
            .filter(soal => soal.isAnswered === false)
        };
        io.emit("getSoal", filteredData);
      } else {
        io.emit("getSoal", {});
      }
    }
  });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('server running at http://localhost:3000');


});