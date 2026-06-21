import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const [, , sourceArg, targetArg] = process.argv;

if (!sourceArg || !targetArg) {
  console.error('Usage: node scripts/copy-package-assets.mjs <source> <target>');
  process.exit(1);
}

const source = resolve(process.cwd(), sourceArg);
const target = resolve(process.cwd(), targetArg);

if (!existsSync(source)) {
  console.error(`Asset source does not exist: ${source}`);
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
cpSync(source, target, { recursive: true });
