// This file serves as the entry point for both the bot and the admin panel
import '../bot/index';
import path from 'path';
import { spawn } from 'child_process';

// Start the admin panel server
const adminServerPath = path.join(__dirname, '../../admin/server/dist/index.js');

// Check if we're in development or production mode
const isDev = process.env.NODE_ENV === 'development';

// In development mode, we'll start the admin server directly
// In production, we assume it's already running or will be started separately
if (isDev) {
  try {
    const adminServer = spawn('node', [adminServerPath], {
      stdio: 'inherit'
    });

    adminServer.on('error', (err) => {
      console.error('Failed to start admin server:', err);
    });

    process.on('exit', () => {
      adminServer.kill();
    });

    console.log('Admin panel server started successfully');
  } catch (error) {
    console.error('Error starting admin panel server:', error);
  }
} else {
  console.log('Admin panel should be started separately in production mode');
}

console.log('Bot and admin panel initialized');
