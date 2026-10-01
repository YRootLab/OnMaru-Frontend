/**
 * Lucide → HugeIcons migration script
 * Usage: node scripts/migrate-icons.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const MAPPING = {
  Activity: 'Activity01Icon',
  AlertCircle: 'AlertCircleIcon',
  Angry: 'AngryIcon',
  ArrowLeft: 'ArrowLeft01Icon',
  ArrowRight: 'ArrowRight01Icon',
  ArrowUp: 'ArrowUp01Icon',
  Award: 'Award01Icon',
  Bookmark: 'Bookmark01Icon',
  BookmarkCheck: 'BookmarkCheck01Icon',
  BookOpen: 'BookOpen01Icon',
  CalendarDays: 'CalendarDaysIcon',
  Camera: 'Camera01Icon',
  Check: 'CheckIcon',
  CheckCircle2: 'CheckmarkCircle01Icon',
  ChevronDown: 'ChevronDownIcon',
  ChevronLeft: 'ChevronLeftIcon',
  ChevronRight: 'ChevronRightIcon',
  ChevronUp: 'ChevronUpIcon',
  Clock: 'Clock01Icon',
  Cloud: 'CloudIcon',
  CloudRain: 'CloudRainIcon',
  Code2: 'CodeIcon',
  Coffee: 'Coffee01Icon',
  Compass: 'Compass01Icon',
  CornerDownLeft: 'CornerDownLeftIcon',
  Database: 'Database01Icon',
  ExternalLink: 'ExternalLinkIcon',
  FileText: 'FileTextIcon',
  Flame: 'FlameIcon',
  Frown: 'FrownIcon',
  Gamepad2: 'Gamepad01Icon',
  Headphones: 'HeadphonesIcon',
  Heart: 'HeartIcon',
  HelpCircle: 'HelpCircleIcon',
  Home: 'Home01Icon',
  Inbox: 'InboxIcon',
  Info: 'InformationCircleIcon',
  Landmark: 'LandmarkIcon',
  Layers: 'Layers01Icon',
  LayoutGrid: 'GridViewIcon',
  Leaf: 'Leaf01Icon',
  List: 'ListIcon',
  Loader2: 'LoaderCircleIcon',
  Lock: 'LockIcon',
  Mail: 'Mail01Icon',
  Map: 'MapIcon',
  MapPin: 'MapPinIcon',
  Maximize2: 'ArrowExpand01Icon',
  Medal: 'Medal01Icon',
  Megaphone: 'Megaphone01Icon',
  Meh: 'MehIcon',
  Menu: 'Menu01Icon',
  MessageCircle: 'MessageCircleIcon',
  Minimize2: 'ArrowShrink01Icon',
  Moon: 'Moon01Icon',
  Music: 'Music01Icon',
  Pause: 'PauseIcon',
  PenLine: 'PenLineIcon',
  Play: 'PlayIcon',
  Plus: 'PlusSignIcon',
  RefreshCw: 'RefreshCwIcon',
  RotateCcw: 'RotateCcwIcon',
  RotateCw: 'RotateCwIcon',
  Route: 'Route01Icon',
  Search: 'Search01Icon',
  ShieldAlert: 'ShieldAlertIcon',
  ShieldCheck: 'ShieldCheckIcon',
  ShoppingBag: 'ShoppingBag01Icon',
  Smile: 'SmileIcon',
  SmilePlus: 'SmilePlusIcon',
  Sparkles: 'SparklesIcon',
  Sun: 'Sun01Icon',
  Tag: 'Tag01Icon',
  Timer: 'Timer01Icon',
  Trophy: 'TrophyIcon',
  User: 'UserIcon',
  UserCheck: 'UserCheck01Icon',
  Users: 'UsersIcon',
  UserX: 'UserXIcon',
  Utensils: 'UtensilsIcon',
  Volume2: 'VolumeHighIcon',
  X: 'Cancel01Icon',
};

// These need styled(HugeiconsIcon).attrs({ icon: XxxIcon }) treatment
const STYLED_ICONS = new Set(['ChevronDown', 'ChevronRight', 'AlertCircle']);

function transformFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Find all lucide-react import lines (may span multiple lines in some files)
  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]\s*;?/g;
  let match;
  const allLucideImports = [];

  while ((match = importRegex.exec(content)) !== null) {
    allLucideImports.push({
      full: match[0],
      names: match[1].split(',').map(n => n.trim()).filter(Boolean),
    });
  }

  if (allLucideImports.length === 0) return;

  // Collect all imported icon names and types
  const allIconNames = [];
  const hasLucideIconType = allLucideImports.some(imp =>
    imp.names.includes('LucideIcon')
  );

  for (const imp of allLucideImports) {
    for (const name of imp.names) {
      if (name !== 'LucideIcon' && MAPPING[name]) {
        allIconNames.push(name);
      }
    }
  }

  if (allIconNames.length === 0 && !hasLucideIconType) return;

  // Build new import lines
  const hugeIconNames = [...new Set(allIconNames.map(n => MAPPING[n]))];

  const reactImportParts = ['HugeiconsIcon'];
  if (hasLucideIconType) reactImportParts.push('type IconSvgElement');

  const newReactImport = `import { ${reactImportParts.join(', ')} } from '@hugeicons/react'`;
  const newIconsImport = hugeIconNames.length > 0
    ? `import { ${hugeIconNames.join(', ')} } from '@hugeicons/core-free-icons'`
    : '';

  // Replace the first lucide import with new imports, remove subsequent ones
  let firstReplaced = false;
  for (const imp of allLucideImports) {
    if (!firstReplaced) {
      const replacement = [newReactImport, newIconsImport].filter(Boolean).join('\n');
      content = content.replace(imp.full, replacement);
      firstReplaced = true;
    } else {
      content = content.replace(imp.full, '');
    }
  }

  // Replace JSX usages: <IconName → <HugeiconsIcon icon={HugeIconName}
  for (const lucideName of allIconNames) {
    const hugeName = MAPPING[lucideName];

    // Check for styled(IconName) pattern → styled(HugeiconsIcon).attrs({ icon: HugeIconName })
    content = content.replace(
      new RegExp(`styled\\(${lucideName}\\)`, 'g'),
      `styled(HugeiconsIcon).attrs({ icon: ${hugeName} })`
    );

    // JSX opening tag: <IconName followed by space, >, /, or newline
    content = content.replace(
      new RegExp(`<${lucideName}(\\s|>|\\/)`, 'g'),
      (m, after) => `<HugeiconsIcon icon={${hugeName}}${after}`
    );

    // JSX closing tag (rare but handle it): </IconName>
    content = content.replace(
      new RegExp(`</${lucideName}>`, 'g'),
      '</HugeiconsIcon>'
    );
  }

  // Replace LucideIcon type references
  if (hasLucideIconType) {
    content = content.replace(/\bLucideIcon\b/g, 'IconSvgElement');
  }

  // Clean up any double blank lines left by removed imports
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${filePath}`);
  }
}

function walkSync(dir, exts, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        walkSync(full, exts, results);
      }
    } else if (exts.includes(extname(entry.name)) && !entry.name.endsWith('.d.ts')) {
      results.push(full);
    }
  }
  return results;
}

function main() {
  const files = walkSync(join(process.cwd(), 'src'), ['.tsx', '.ts', '.jsx']);
  console.log(`Found ${files.length} files to check\n`);
  let changed = 0;

  for (const file of files) {
    const before = readFileSync(file, 'utf-8');
    transformFile(file);
    const after = readFileSync(file, 'utf-8');
    if (before !== after) changed++;
  }

  console.log(`\nDone. ${changed} files transformed.`);
}

main();
