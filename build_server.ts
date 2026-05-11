import * as esbuild from 'esbuild';

async function build() {
  console.log('Building server...');
  try {
    await esbuild.build({
      entryPoints: ['server.ts'],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      outfile: 'dist/server.cjs',
      external: ['vite', 'express', '@google/genai', 'dotenv'], // Keep these external to avoid bloating and respect node environment
    });
    console.log('Server build complete: dist/server.cjs');
  } catch (err) {
    console.error('Server build failed:', err);
    process.exit(1);
  }
}

build();
