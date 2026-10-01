/**
 * Pass 2: fix remaining icon references in already-transformed files.
 * - Bare identifier replacements (icon: Flame → icon: FlameIcon)
 * - Missing icons not covered in pass 1
 * Usage: node scripts/migrate-icons-pass2.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';

// Complete mapping including pass-1 icons + newly discovered ones
const MAPPING = {
  // Pass 1 icons
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
  // Pass 2: newly discovered icons
  ArrowLeftRight: 'ArrowLeftRightIcon',
  ArrowUpRight: 'ArrowUpRight01Icon',
  Bot: 'BotIcon',
  Building: 'Building01Icon',
  Calendar: 'Calendar01Icon',
  Car: 'Car01Icon',
  Clapperboard: 'ClapperboardIcon',
  CloudUpload: 'CloudUploadIcon',
  Copy: 'Copy01Icon',
  Crown: 'CrownIcon',
  Download: 'Download01Icon',
  EyeOff: 'EyeOffIcon',
  Film: 'Film01Icon',
  Flower2: 'Flower01Icon',
  Gauge: 'GaugeIcon',
  Globe: 'GlobeIcon',
  Hash: 'HashtagIcon',
  ImageIcon: 'Image01Icon',
  Images: 'Image02Icon',
  LayoutDashboard: 'DashboardCircleIcon',
  LocateFixed: 'LocateFixedIcon',
  LogOut: 'Logout01Icon',
  Minus: 'MinusSignIcon',
  MoreHorizontal: 'MoreHorizontalIcon',
  Music2: 'Music02Icon',
  Navigation: 'Navigation01Icon',
  Network: 'NetworkIcon',
  Phone: 'PhoneIcon',
  Plane: 'Airplane01Icon',
  Share2: 'Share01Icon',
  SkipBack: 'SkipBackIcon',
  SkipForward: 'SkipForwardIcon',
  Snowflake: 'SnowflakeIcon',
  Sprout: 'SproutIcon',
  Square: 'SquareIcon',
  Store: 'Store01Icon',
  SunMedium: 'SunMediumIcon',
  Swords: 'Sword01Icon',
  Ticket: 'Ticket01Icon',
  Trash2: 'TrashIcon',
  Wand2: 'MagicWand01Icon',
  Wind: 'WindIcon',
  XCircle: 'CancelCircleIcon',
  ZoomIn: 'ZoomInIcon',
};

const HUGE_IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*'@hugeicons\/core-free-icons'/;

function transformFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Only process files that already have @hugeicons imports (pass 1 ran on them)
  if (!content.includes("from '@hugeicons/react'") && !content.includes('from "@hugeicons/react"')) return;

  const neededHugeIcons = new Set();
  const toReplace = [];

  // Find all Lucide icon names still referenced in this file
  for (const [lucideName, hugeName] of Object.entries(MAPPING)) {
    // Use word boundary regex to find bare identifier usages
    const regex = new RegExp(`(?<!['"a-zA-Z0-9_])${lucideName}(?![a-zA-Z0-9_'"])`, 'g');
    if (regex.test(content)) {
      neededHugeIcons.add(hugeName);
      toReplace.push([lucideName, hugeName]);
    }
  }

  if (toReplace.length === 0) return;

  // Check what HugeIcons are already imported
  const existingMatch = HUGE_IMPORT_RE.exec(content);
  const existingIcons = existingMatch
    ? new Set(existingMatch[1].split(',').map(s => s.trim()).filter(Boolean))
    : new Set();

  // Add newly needed icons to the import
  const allIcons = new Set([...existingIcons, ...neededHugeIcons]);
  const newIconsImport = `import { ${[...allIcons].sort().join(', ')} } from '@hugeicons/core-free-icons'`;

  if (existingMatch) {
    content = content.replace(existingMatch[0], newIconsImport);
  } else {
    // Insert after @hugeicons/react import
    content = content.replace(
      /import\s*\{[^}]+\}\s*from\s*'@hugeicons\/react'/,
      (m) => `${m}\n${newIconsImport}`
    );
  }

  // Replace bare Lucide names with HugeIcons names
  // Do longest names first to avoid partial replacements
  toReplace.sort((a, b) => b[0].length - a[0].length);

  for (const [lucideName, hugeName] of toReplace) {
    // Replace as JSX opening tags too (in case pass-1 missed some)
    content = content.replace(
      new RegExp(`<${lucideName}(\\s|>|\\/)`, 'g'),
      (m, after) => `<HugeiconsIcon icon={${hugeName}}${after}`
    );
    // Replace bare identifier (not preceded/followed by alnum/_)
    content = content.replace(
      new RegExp(`(?<![a-zA-Z0-9_$])${lucideName}(?![a-zA-Z0-9_$])`, 'g'),
      hugeName
    );
  }

  // Fix React.ComponentType<...> for icon props → use IconSvgElement
  content = content.replace(
    /React\.ComponentType<\{[^}]*size\?[^}]*\}>/g,
    'import("@hugeicons/react").then(m => m.HugeiconsIconProps)["icon"]'
  );
  // Simpler fix: replace the icon type annotation
  content = content.replace(
    /icon:\s*React\.ComponentType<[^>]+>/g,
    'icon: IconSvgElement'
  );

  // If IconSvgElement now used, ensure it's in the @hugeicons/react import
  if (content.includes('IconSvgElement')) {
    content = content.replace(
      /import\s*\{\s*HugeiconsIcon\s*\}\s*from\s*'@hugeicons\/react'/,
      "import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'"
    );
    content = content.replace(
      /import\s*\{\s*HugeiconsIcon,\s*type\s*IconSvgElement\s*\}\s*from\s*'@hugeicons\/react'/,
      "import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'"
    );
  }

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ ${filePath.split('\\').slice(-3).join('\\')}`);
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
  let changed = 0;
  for (const file of files) {
    const before = readFileSync(file, 'utf-8');
    transformFile(file);
    const after = readFileSync(file, 'utf-8');
    if (before !== after) changed++;
  }
  console.log(`\nDone. ${changed} files updated.`);
}

main();
