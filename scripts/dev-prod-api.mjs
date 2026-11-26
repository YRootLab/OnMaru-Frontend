import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const nextArgs = ['dev', ...process.argv.slice(2)];

if (!nextArgs.includes('--port') && !nextArgs.includes('-p')) {
  nextArgs.push('--port', '3000');
}

const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  env: {
    ...process.env,
    NEXT_PUBLIC_API_URL: 'http://localhost:3000/api/proxy',
    NEXT_PUBLIC_API_URL_INTERNAL: 'https://api.onmaru.site',
  },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exitCode = code ?? 1;
});
