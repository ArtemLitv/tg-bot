import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { spawn, ChildProcess } from 'child_process';
import dotenv from 'dotenv';

// Import routes
import botRoutes from './routes/bot';
import menuRoutes from './routes/menu';
import envRoutes from './routes/env';
import logsRoutes from './routes/logs';
import { addLog } from './routes/logs';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Store bot process
let botProcess: ChildProcess | null = null;

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected');
  addLog('info', `Client connected: ${socket.id}`);

  // Send current bot status
  socket.emit('botStatus', { running: botProcess !== null });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    addLog('info', `Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/bot', botRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/env', envRoutes);
app.use('/api/logs', logsRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  addLog('info', `Server started on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  addLog('error', `Server error: ${error.message}`);
});

// Export for use in routes
export { io, botProcess };
