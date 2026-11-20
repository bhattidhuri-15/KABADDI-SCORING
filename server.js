const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 3000;

// Ensure uploads dir
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Game state
let gameState = {
  teamA: { name: 'Team A', namePunjabi: '', score: 0, logo: '' },
  teamB: { name: 'Team B', namePunjabi: '', score: 0, logo: '' },
  timer: '20:00',
  timerRunning: false,
  timerSeconds: 1200,
  ticker: 'Welcome to Circle Kabaddi Live',
  showTicker: false,
  player: { name: '', info: '', img: '' },
  showPlayer: false
};

let timerInterval = null;

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'control.html')));
app.get('/control', (req, res) => res.sendFile(path.join(__dirname, 'public', 'control.html')));
app.get('/overlay', (req, res) => res.sendFile(path.join(__dirname, 'public', 'overlay.html')));

// Logo upload endpoint
app.post('/upload-logo', upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const logoUrl = `/uploads/${req.file.filename}`;
  res.json({ logoUrl });
});

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('state', gameState);

  socket.on('updateScore', (data) => {
    const { team, delta } = data;
    if (team === 'A') {
      gameState.teamA.score = Math.max(0, gameState.teamA.score + (delta || 0));
    } else if (team === 'B') {
      gameState.teamB.score = Math.max(0, gameState.teamB.score + (delta || 0));
    }
    io.emit('state', gameState);
  });

  socket.on('updateTeams', (data) => {
    if (data.teamAName !== undefined) gameState.teamA.name = data.teamAName;
    if (data.teamBName !== undefined) gameState.teamB.name = data.teamBName;
    if (data.teamANamePunjabi !== undefined) gameState.teamA.namePunjabi = data.teamANamePunjabi;
    if (data.teamBNamePunjabi !== undefined) gameState.teamB.namePunjabi = data.teamBNamePunjabi;
    if (data.teamALogo !== undefined) gameState.teamA.logo = data.teamALogo;
    if (data.teamBLogo !== undefined) gameState.teamB.logo = data.teamBLogo;
    io.emit('state', gameState);
  });

  socket.on('resetScores', () => {
    gameState.teamA.score = 0;
    gameState.teamB.score = 0;
    io.emit('state', gameState);
  });

  socket.on('timer', (data) => {
    if (data.action === 'start' && !gameState.timerRunning) {
      gameState.timerRunning = true;
      timerInterval = setInterval(() => {
        if (gameState.timerSeconds > 0) {
          gameState.timerSeconds--;
          gameState.timer = formatTime(gameState.timerSeconds);
          io.emit('state', gameState);
        } else {
          clearInterval(timerInterval);
          gameState.timerRunning = false;
        }
      }, 1000);
    } else if (data.action === 'pause') {
      gameState.timerRunning = false;
      if (timerInterval) clearInterval(timerInterval);
    } else if (data.action === 'reset') {
      gameState.timerRunning = false;
      if (timerInterval) clearInterval(timerInterval);
      gameState.timerSeconds = 1200;
      gameState.timer = '20:00';
      io.emit('state', gameState);
    }
  });

  socket.on('toggleTicker', () => {
    gameState.showTicker = !gameState.showTicker;
    io.emit('state', gameState);
  });

  socket.on('setTicker', (text) => {
    gameState.ticker = text || '';
    io.emit('state', gameState);
  });

  socket.on('showPlayer', (p) => {
    gameState.player = p;
    gameState.showPlayer = true;
    io.emit('state', gameState);
  });

  socket.on('hidePlayer', () => {
    gameState.showPlayer = false;
    io.emit('state', gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kabaddi Scorer running on http://0.0.0.0:${PORT}`);
  console.log(`Control: http://localhost:${PORT}/control`);
  console.log(`Overlay (for OBS): http://localhost:${PORT}/overlay`);
});
