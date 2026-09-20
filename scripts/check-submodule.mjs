import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const CORE_UI_PATH = 'src/private/core-ui';
const REQUIRED_CORE_UI_FILE = `${CORE_UI_PATH}/sorimaru/SorimaruAutoSliceRail.tsx`;

function main() {
  const errors = [];

  try {
    const status = execFileSync('git', ['submodule', 'status', '--recursive'], {
      encoding: 'utf8',
    });
    const coreUiStatus = status.split(/\r?\n/).find((line) => line.includes(` ${CORE_UI_PATH}`));

    if (!coreUiStatus || coreUiStatus.startsWith('-')) {
      errors.push(`${CORE_UI_PATH} is not initialized`);
    }
  } catch {
    errors.push('Unable to inspect git submodule status');
  }

  if (!existsSync(REQUIRED_CORE_UI_FILE)) {
    errors.push(`${REQUIRED_CORE_UI_FILE} is missing`);
  }

  if (errors.length > 0) {
    console.error('Private Core UI submodule check failed:');
    errors.forEach((error) => console.error(`- ${error}`));
    console.error('Run: npm run submodule:init');
    process.exit(1);
  }

  console.log('Private Core UI submodule check passed.');
}

main();
