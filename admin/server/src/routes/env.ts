import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import { addLog } from './logs';

const router = express.Router();

// Path to the .env file
const envFilePath = path.join(__dirname, '../../../../.env');

// Get environment variables
router.get('/', (req, res) => {
  addLog('info', 'Environment variables requested');
  try {
    // Check if .env file exists
    if (!fs.existsSync(envFilePath)) {
      addLog('error', `Env file not found at path: ${envFilePath}`);
      return res.status(404).json({ error: '.env file not found' });
    }

    // Read .env file
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    addLog('info', 'Env file read successfully');

    // Parse .env file
    const envConfig = dotenv.parse(envContent);

    // Return only the TELEGRAM_BOT_TOKEN for security
    const hasToken = !!envConfig.TELEGRAM_BOT_TOKEN;
    addLog('info', `Environment variables retrieved successfully. Token present: ${hasToken}`);
    res.json({ 
      TELEGRAM_BOT_TOKEN: envConfig.TELEGRAM_BOT_TOKEN || '' 
    });
  } catch (error) {
    console.error('Failed to read .env file:', error);
    // @ts-ignore
    addLog('error', `Failed to read environment variables: ${error.message}`);
    res.status(500).json({ error: 'Failed to read environment variables' });
  }
});

// Update environment variables
router.post('/', (req, res) => {
  addLog('info', 'Environment variables update requested');
  try {
    const { TELEGRAM_BOT_TOKEN } = req.body;

    if (!TELEGRAM_BOT_TOKEN) {
      addLog('warn', 'Environment update rejected: empty TELEGRAM_BOT_TOKEN');
      return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN is required' });
    }

    // Check if .env file exists
    let envContent = '';
    if (fs.existsSync(envFilePath)) {
      // Read existing .env file
      envContent = fs.readFileSync(envFilePath, 'utf8');
      addLog('info', 'Existing env file read successfully');

      // Update TELEGRAM_BOT_TOKEN
      if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
        // Replace existing token
        addLog('info', 'Updating existing TELEGRAM_BOT_TOKEN');
        envContent = envContent.replace(
          /TELEGRAM_BOT_TOKEN=.*/,
          `TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}`
        );
      } else {
        // Add token if it doesn't exist
        addLog('info', 'Adding new TELEGRAM_BOT_TOKEN to existing file');
        envContent += `\nTELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}`;
      }
    } else {
      // Create new .env file with token
      addLog('info', 'Creating new .env file with TELEGRAM_BOT_TOKEN');
      envContent = `# Telegram Bot Configuration\nTELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}`;
    }

    // Write updated content to .env file
    fs.writeFileSync(envFilePath, envContent);
    addLog('info', 'Environment variables updated successfully');

    res.json({ success: true, message: 'Environment variables updated successfully' });
  } catch (error) {
    console.error('Failed to update .env file:', error);
    // @ts-ignore
    addLog('error', `Failed to update environment variables: ${error.message}`);
    res.status(500).json({ error: 'Failed to update environment variables' });
  }
});

export default router;
