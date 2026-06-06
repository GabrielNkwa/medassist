import { build } from 'esbuild';
import path from 'node:path';
const result = await build({
  entryPoints: [path.resolve(process.cwd(), 'src/index.ts')],
  platform: 'node', bundle: true, format: 'esm', write: false, sourcemap: false, metafile: true,
  external: [
    '@workspace/db', '@workspace/api-zod', 'express', 'openai', 'drizzle-orm', 'zod', 'mime-db', 'iconv-lite', 'pg', 'dotenv', 'pino', 'pino-http', 'pino-pretty', 'thread-stream', 'cors', 'cookie-parser', 'pdfkit', 'form-data', 'source-map-support'
  ]
});
console.log('Output size KB:', Object.values(result.outputFiles || {}).reduce((sum,f)=>sum+f.contents.length,0)/1024);
console.log('Outputs:', Object.keys(result.outputFiles || {}));
