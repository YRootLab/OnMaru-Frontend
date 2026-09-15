import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ODII_KEY_ALIASES = [
  'ODII_API_KEY',
  'SORIMARU_API_KEY',
  'NEXT_PUBLIC_ODII_API_KEY',
  'NEXT_PUBLIC_SORIMARU_API_KEY',
];

const SECRET_ENV_FILE_PATTERN = /^\.env(?:\..+)?$/;
const ALLOWED_TRACKED_ENV_FILES = new Set(['.env.example']);

export function parseEnvText(text) {
  const values = {};
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const index = line.indexOf('=');
      if (index === -1) return;
      const key = line.slice(0, index).trim();
      const value = line.slice(index + 1).trim();
      if (key) values[key] = value;
    });
  return values;
}

export function validateEnvValues(values) {
  const errors = [];
  const hasOdiiKey = ODII_KEY_ALIASES.some((key) => Boolean(values[key]));

  if (!hasOdiiKey) {
    errors.push(`Missing Odii API key alias. Set one of: ${ODII_KEY_ALIASES.join(', ')}`);
  }

  return { errors };
}

export function validateEnvContractFromFiles({
  gitignoreText,
  envExampleText,
  envLocalText,
  trackedFiles,
}) {
  const errors = [];

  if (!gitignoreText.split(/\r?\n/).some((line) => line.trim() === '.env*')) {
    errors.push('.gitignore must ignore .env*');
  }

  if (!gitignoreText.split(/\r?\n/).some((line) => line.trim() === '!.env.example')) {
    errors.push('.gitignore must allow tracking .env.example');
  }

  trackedFiles
    .filter((file) => SECRET_ENV_FILE_PATTERN.test(file) && !ALLOWED_TRACKED_ENV_FILES.has(file))
    .forEach((file) => errors.push(`Secret env file is tracked by git: ${file}`));

  errors.push(...validateEnvValues(parseEnvText(envExampleText)).errors.map((error) => `.env.example: ${error}`));

  if (envLocalText !== undefined) {
    errors.push(...validateEnvValues(parseEnvText(envLocalText)).errors.map((error) => `.env.local: ${error}`));
  }

  return { errors };
}

function readIfExists(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : undefined;
}

function getTrackedFiles() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
}

function main() {
  const result = validateEnvContractFromFiles({
    gitignoreText: readIfExists('.gitignore') ?? '',
    envExampleText: readIfExists('.env.example') ?? '',
    envLocalText: readIfExists('.env.local'),
    trackedFiles: getTrackedFiles(),
  });

  if (result.errors.length > 0) {
    console.error('Environment contract check failed:');
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log('Environment contract check passed.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
