import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, 'artifacts/medassist/dist');
const dest = path.resolve(__dirname, 'public');

console.log('Copying assets...');
console.log(`Source: ${src}`);
console.log(`Destination: ${dest}`);

try {
  await fs.rm(dest, { recursive: true, force: true });
  console.log('Removed old public directory');
  
  await fs.cp(src, dest, { recursive: true });
  console.log('Copied assets successfully!');
} catch (err) {
  console.error('Error copying assets:', err);
  process.exit(1);
}
