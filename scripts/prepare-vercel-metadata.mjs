import { mkdir, writeFile } from 'node:fs/promises';
import { URLSearchParams } from 'node:url';

const {
  VERCEL_TOKEN,
  VERCEL_ORG_ID,
  VERCEL_PROJECT_ID,
  VERCEL_ENVIRONMENT,
} = process.env;

for (const key of ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID', 'VERCEL_ENVIRONMENT']) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const apiBase = 'https://api.vercel.com';
const headers = {
  Authorization: 'Bearer ' + VERCEL_TOKEN,
};
const search = new URLSearchParams({
  source: 'github-actions-deploy',
  teamId: VERCEL_ORG_ID,
});

async function fetchText(path) {
  const response = await fetch(`${apiBase}${path}?${search.toString()}`, { headers });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  return text;
}

async function fetchJson(path) {
  return JSON.parse(await fetchText(path));
}

function escapeValue(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function getEnvEntryValue(entry) {
  if (entry && typeof entry === 'object' && 'value' in entry) {
    return entry.value;
  }

  return entry;
}

function isDotenvText(rawText) {
  const lines = rawText.split(/\r?\n/);
  return lines.every((line) => {
    const trimmed = line.trim();
    return !trimmed || trimmed.startsWith('#') || /^[A-Za-z_][A-Za-z0-9_]*=/.test(trimmed);
  });
}

function toDotenvContents(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && parsed.env && typeof parsed.env === 'object' && !Array.isArray(parsed.env)) {
      return `# Created by Vercel CLI\n${Object.keys(parsed.env)
        .sort()
        .map((key) => `${key}="${escapeValue(getEnvEntryValue(parsed.env[key]))}"`)
        .join('\n')}\n`;
    }

    throw new Error('Unexpected JSON env payload shape.');
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error;
    }
  }

  if (isDotenvText(rawText)) {
    return rawText.endsWith('\n') ? rawText : `${rawText}\n`;
  }

  throw new Error('Unexpected env pull payload format.');
}

function getAnalyticsId(project) {
  const enabledAt = project.analytics?.enabledAt ? new Date(project.analytics.enabledAt).getTime() : Number.NaN;
  const disabledAt = project.analytics?.disabledAt ? new Date(project.analytics.disabledAt).getTime() : Number.NaN;

  return project.analytics?.id &&
    (!project.analytics.disabledAt ||
      (!Number.isNaN(enabledAt) && !Number.isNaN(disabledAt) && enabledAt > disabledAt))
    ? project.analytics.id
    : undefined;
}

const [project, envPull] = await Promise.all([
  fetchJson(`/v9/projects/${encodeURIComponent(VERCEL_PROJECT_ID)}`),
  fetchText(`/v3/env/pull/${encodeURIComponent(VERCEL_PROJECT_ID)}/${encodeURIComponent(VERCEL_ENVIRONMENT)}`),
]);

await mkdir('.vercel', { recursive: true });
await writeFile(
  '.vercel/project.json',
  `${JSON.stringify(
    {
      projectId: VERCEL_PROJECT_ID,
      orgId: VERCEL_ORG_ID,
      projectName: project.name,
      settings: {
        createdAt: project.createdAt,
        framework: project.framework,
        devCommand: project.devCommand,
        installCommand: project.installCommand,
        buildCommand: project.buildCommand,
        outputDirectory: project.outputDirectory,
        rootDirectory: project.rootDirectory,
        directoryListing: project.directoryListing,
        nodeVersion: project.nodeVersion,
        analyticsId: getAnalyticsId(project),
      },
    },
    null,
    2,
  )}\n`,
);
await writeFile(`.vercel/.env.${VERCEL_ENVIRONMENT}.local`, toDotenvContents(envPull));
