// This script runs BEFORE the main build and GUARANTEES public directory exists
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

console.log('🔧 PREBUILD: Ensuring public directory exists...');

try {
  // Create public directory if it doesn't exist
  if (!fsSync.existsSync(publicDir)) {
    await fs.mkdir(publicDir, { recursive: true });
    console.log('✅ Created public directory');
  }

  // Create a minimal index.html as fallback
  const indexPath = path.join(publicDir, 'index.html');
  const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medical Aid Buddy</title>
</head>
<body>
  <h1>Medical Aid Buddy</h1>
  <p>Loading application...</p>
</body>
</html>`;

  await fs.writeFile(indexPath, fallbackHtml);
  console.log('✅ Created fallback index.html in public directory');
  
  console.log('✅ PREBUILD COMPLETE - Public directory is READY!');
} catch (err) {
  console.error('❌ PREBUILD ERROR:', err);
  // Even if something goes wrong, TRY to create directory
  try {
    await fs.mkdir(publicDir, { recursive: true });
  } catch {}
}
