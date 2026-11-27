require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'TenantFlow Multi-Tenant SaaS API Running' });
});

io.on('connection', (socket) => {
  console.log(\User connected: \\);

  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(\Socket \ joined project room: \\);
  });

  socket.on('disconnect', () => {
    console.log(\User disconnected: \\);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(\Server running on port \\));
