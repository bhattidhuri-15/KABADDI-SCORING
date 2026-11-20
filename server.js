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
  teamB: { name: 'Team B', namePunjabi: '', score: 0, logo: '' }
};

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

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Kabaddi Scorer running on http://0.0.0.0:${PORT}`);
  console.log(`Control: http://localhost:${PORT}/control`);
  console.log(`Overlay (for OBS): http://localhost:${PORT}/overlay`);
});
