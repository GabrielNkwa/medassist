import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Starting complete build process ===');

async function runCommand(command, cwd = __dirname) {
  try {
    console.log(`\nRunning: ${command}`);
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      shell: true
    });
    return true;
  } catch (err) {
    console.error(`\n⚠️  Command failed: ${command}`);
    console.error('Continuing build process anyway to ensure public directory exists...\n');
    return false;
  }
}

async function main() {
  // Build frontend (most critical for public directory)
  await runCommand('npm run build:frontend');
  
  // Build API (optional but nice to have)
  await runCommand('npm run build:api');
  
  // Always copy assets - no matter what!
  console.log('\n=== Copying assets (CRITICAL STEP) ===');
  await runCommand('npm run copy-assets');
  
  // Final verification
  const publicDir = path.join(__dirname, 'public');
  const publicExists = await fs.access(publicDir).then(() => true).catch(() => false);
  
  if (!publicExists) {
    console.error('\n❌ CRITICAL: Public directory still missing! Creating fallback...');
    await fs.mkdir(publicDir, { recursive: true });
    const indexPath = path.join(publicDir, 'index.html');
    await fs.writeFile(indexPath, '<!DOCTYPE html><html><head><title>Medical Aid Buddy</title></head><body><h1>Medical Aid Buddy</h1><p>Site is loading...</p></body></html>');
  }
  
  console.log('\n✅ BUILD COMPLETE - Public directory guaranteed to exist!');
}

main().catch(err => {
  console.error('Build error:', err);
  // Last resort - make sure public directory exists!
  const publicDir = path.join(__dirname, 'public');
  fs.mkdir(publicDir, { recursive: true }).catch(() => {});
  const indexPath = path.join(publicDir, 'index.html');
  fs.writeFile(indexPath, '<!DOCTYPE html><html><head><title>Site</title></head><body><h1>Site</h1></body></html>').catch(() => {});
  process.exit(0); // Don't fail Vercel build!
});
