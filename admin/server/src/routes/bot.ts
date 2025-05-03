import express from 'express';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { io } from '../index';
import { addLog } from './logs';

const router = express.Router();

// Reference to the bot process
let botProcess: ChildProcess | null = null;

// Start the bot
router.post('/start', (req, res) => {
  if (botProcess) {
    addLog('warn', 'Attempted to start bot when it was already running');
    return res.status(400).json({ error: 'Bot is already running' });
  }

  try {
    addLog('info', 'Starting bot process');
    // Path to the bot's main file - use TypeScript source directly with ts-node
    const botPath = path.join(__dirname, '../../../../src/index.ts');

    // Spawn the bot process using ts-node to run TypeScript directly
    botProcess = spawn('npx', ['ts-node', botPath], {
      cwd: path.join(__dirname, '../../../..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Handle bot output for logs
    if (botProcess.stdout) {
      botProcess.stdout.on('data', (data) => {
        const log = data.toString();
        console.log(`Bot stdout: ${log}`);
        io.emit('botLog', { type: 'stdout', message: log });
        addLog('info', `Bot stdout: ${log.trim()}`);
      });
    }

    if (botProcess.stderr) {
      botProcess.stderr.on('data', (data) => {
        const log = data.toString();
        console.error(`Bot stderr: ${log}`);
        io.emit('botLog', { type: 'stderr', message: log });
        addLog('error', `Bot stderr: ${log.trim()}`);
      });
    }

    // Handle bot exit
    botProcess.on('close', (code) => {
      console.log(`Bot process exited with code ${code}`);
      addLog('info', `Bot process exited with code ${code}`);
      botProcess = null;
      io.emit('botStatus', { running: false });
    });

    // Notify clients that bot is running
    io.emit('botStatus', { running: true });
    addLog('info', 'Bot started successfully');

    res.json({ success: true, message: 'Bot started successfully' });
  } catch (error) {
    console.error('Failed to start bot:', error);
    // @ts-ignore
    addLog('error', `Failed to start bot: ${error.message}`);
    res.status(500).json({ error: 'Failed to start bot' });
  }
});

// Stop the bot
router.post('/stop', (req, res) => {
  if (!botProcess) {
    addLog('warn', 'Attempted to stop bot when it was not running');
    return res.status(400).json({ error: 'Bot is not running' });
  }

  try {
    addLog('info', 'Stopping bot process');
    // Kill the bot process
    botProcess.kill();
    botProcess = null;

    // Notify clients that bot is stopped
    io.emit('botStatus', { running: false });
    addLog('info', 'Bot stopped successfully');

    res.json({ success: true, message: 'Bot stopped successfully' });
  } catch (error) {
    console.error('Failed to stop bot:', error);
    // @ts-ignore
    addLog('error', `Failed to stop bot: ${error.message}`);
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Get bot status
router.get('/status', (req, res) => {
  const status = botProcess !== null;
  addLog('info', `Bot status requested: ${status ? 'running' : 'stopped'}`);
  res.json({ running: status });
});

export default router;
