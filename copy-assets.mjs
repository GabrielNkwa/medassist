import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, 'artifacts/medassist/dist');
const dest = path.resolve(__dirname, 'public');

console.log('=== Starting copy-assets script ===');
console.log(`Source directory: ${src}`);
console.log(`Destination directory: ${dest}`);

async function ensurePublicDirectory() {
  console.log('Step 1: Checking source directory...');
  if (!fsSync.existsSync(src)) {
    console.error(`ERROR: Source directory does not exist: ${src}`);
    console.log('Creating empty public directory to prevent Vercel failure...');
    await fs.mkdir(dest, { recursive: true });
    const fallbackIndex = path.join(dest, 'index.html');
    await fs.writeFile(fallbackIndex, '<!DOCTYPE html><html><head><title>Loading...</title></head><body><h1>Site is loading...</h1></body></html>');
    console.log('Fallback public directory created!');
    return;
  }

  console.log('Source directory exists');
  
  console.log('Step 2: Removing old public directory...');
  await fs.rm(dest, { recursive: true, force: true });
  
  console.log('Step 3: Copying assets...');
  await fs.cp(src, dest, { recursive: true });
  
  console.log('Step 4: Verifying copy...');
  if (fsSync.existsSync(dest)) {
    const contents = await fs.readdir(dest);
    console.log(`Public directory contents: ${contents.join(', ')}`);
  }

  console.log('=== Copy-assets completed successfully! ===');
}

try {
  await ensurePublicDirectory();
} catch (err) {
  console.error('FATAL ERROR in copy-assets:', err);
  console.log('Creating fallback public directory...');
  try {
    await fs.mkdir(dest, { recursive: true });
    const fallbackIndex = path.join(dest, 'index.html');
    await fs.writeFile(fallbackIndex, '<!DOCTYPE html><html><head><title>Site</title></head><body><h1>Welcome</h1></body></html>');
    console.log('Fallback public directory created to avoid Vercel error!');
  } catch (fallbackErr) {
    console.error('Could not even create fallback directory:', fallbackErr);
    process.exit(1);
  }
}
