import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { io } from '../index';

const router = express.Router();

// In-memory log storage
const logs: { timestamp: string; type: string; message: string }[] = [];
const MAX_LOGS = 1000; // Maximum number of logs to keep in memory

// Add a log entry
const addLog = (type: string, message: string) => {
  const timestamp = new Date().toISOString();
  logs.push({ timestamp, type, message });
  
  // Keep logs under the maximum size
  if (logs.length > MAX_LOGS) {
    logs.shift(); // Remove oldest log
  }
  
  // Emit log to connected clients
  io.emit('newLog', { timestamp, type, message });
};

// Get all logs
router.get('/', (req, res) => {
  // Get query parameters for pagination
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  
  // Return paginated logs
  res.json({
    logs: logs.slice(Math.max(0, logs.length - offset - limit), logs.length - offset),
    total: logs.length
  });
});

// Clear all logs
router.delete('/', (req, res) => {
  logs.length = 0;
  io.emit('logsCleared');
  res.json({ success: true, message: 'Logs cleared successfully' });
});

// Export for use in other files
export { addLog };

export default router;