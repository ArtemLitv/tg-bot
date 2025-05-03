import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { addLog } from './logs';

const execAsync = promisify(exec);
const router = express.Router();

// Path to the menu.ts file
const menuFilePath = path.join(__dirname, '../../../../bot/menu.ts');

// Get menu configuration
router.get('/', async (req, res) => {
  addLog('info', 'Menu configuration requested');
  try {
    // Check if menu.ts file exists
    if (!fs.existsSync(menuFilePath)) {
      addLog('error', `Menu file not found at path: ${menuFilePath}`);
      return res.status(404).json({ error: 'menu.ts file not found' });
    }

    // Read menu.ts file
    const menuContent = fs.readFileSync(menuFilePath, 'utf8');
    addLog('info', 'Menu file read successfully');

    // Extract the menu array using regex
    const menuMatch = menuContent.match(/export const menu: MenuItem\[\] = (\[[\s\S]*?\]);/);

    if (!menuMatch || !menuMatch[1]) {
      addLog('error', 'Failed to parse menu configuration - regex match failed');
      return res.status(500).json({ error: 'Failed to parse menu configuration' });
    }

    // Return the menu configuration as a string
    addLog('info', 'Menu configuration retrieved successfully');
    res.json({ 
      menuString: menuMatch[1],
      menuFilePath: menuFilePath
    });
  } catch (error) {
    console.error('Failed to read menu.ts file:', error);
    // @ts-ignore
    addLog('error', `Failed to read menu configuration: ${error.message}`);
    res.status(500).json({ error: 'Failed to read menu configuration' });
  }
});

// Update menu configuration
router.post('/', async (req, res) => {
  addLog('info', 'Menu configuration update requested');
  try {
    const { menuString } = req.body;

    if (!menuString) {
      addLog('warn', 'Menu update rejected: empty menu configuration');
      return res.status(400).json({ error: 'Menu configuration is required' });
    }

    // Check if menu.ts file exists
    if (!fs.existsSync(menuFilePath)) {
      addLog('error', `Menu file not found at path: ${menuFilePath}`);
      return res.status(404).json({ error: 'menu.ts file not found' });
    }

    // Read existing menu.ts file
    const menuContent = fs.readFileSync(menuFilePath, 'utf8');
    addLog('info', 'Existing menu file read successfully');

    // Replace the menu array in the file
    const updatedContent = menuContent.replace(
      /export const menu: MenuItem\[\] = \[[\s\S]*?\];/,
      `export const menu: MenuItem[] = ${menuString};`
    );

    // Write updated content to menu.ts file
    fs.writeFileSync(menuFilePath, updatedContent);
    addLog('info', 'Menu file updated successfully');

    // Rebuild the project to apply changes
    try {
      addLog('info', 'Starting project rebuild');
      await execAsync('npm run build', { cwd: path.join(__dirname, '../../../..') });
      addLog('info', 'Project rebuilt successfully');
      res.json({ success: true, message: 'Menu configuration updated successfully' });
    } catch (buildError) {
      console.error('Failed to rebuild project:', buildError);
      // @ts-ignore
      addLog('error', `Failed to rebuild project: ${buildError.message}`);
      res.status(500).json({ error: 'Menu updated but failed to rebuild project' });
    }
  } catch (error) {
    console.error('Failed to update menu.ts file:', error);
    // @ts-ignore
    addLog('error', `Failed to update menu configuration: ${error.message}`);
    res.status(500).json({ error: 'Failed to update menu configuration' });
  }
});

export default router;
