/**
 * Print the lowest version that each named optional peer's range admits, as `name@version`
 * arguments for `npm install`.
 *
 *   npm install --no-save $(node scripts/peer-floors.mjs react-router @tanstack/react-router)
 *
 * CI installs these and runs the adapter specs against them, so a range in package.json cannot
 * promise a version the adapter does not work with. Run `npm ci` afterwards to get the locked
 * versions back.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

/** The two shapes a peer range takes in this package: `^1.2.3` and `>=1.2.3`. */
const FLOOR = /^(?:\^|>=)(\d+\.\d+\.\d+)$/;

const names = process.argv.slice(2);

if (names.length === 0) {
  console.error('peer-floors: name at least one optional peer');
  process.exit(1);
}

const floors = names.map((name) => {
  if (!pkg.peerDependenciesMeta?.[name]?.optional) {
    console.error(`peer-floors: ${name} is not an optional peer of ${pkg.name}`);
    process.exit(1);
  }

  const floor = FLOOR.exec(pkg.peerDependencies[name])?.[1];

  if (!floor) {
    console.error(`peer-floors: cannot read a floor from "${pkg.peerDependencies[name]}"`);
    process.exit(1);
  }

  return `${name}@${floor}`;
});

console.log(floors.join(' '));
