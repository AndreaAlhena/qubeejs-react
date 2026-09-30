/**
 * Mirror the repository's CHANGELOG.md into the docs site.
 *
 * Generated rather than copied: a hand-copied changelog is a changelog that
 * silently falls behind. Ported from qubeejs-core's generator, with the prose
 * escaped for MDX.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { mdx } from './mdx.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const changelog = join(here, '..', '..', 'CHANGELOG.md');

if (!existsSync(changelog)) {
  console.error('generate-changelog: CHANGELOG.md is missing at the repository root.');
  process.exit(1);
}

// Drop the H1 and the Keep a Changelog preamble; the page supplies both.
const body = readFileSync(changelog, 'utf8')
  .replace(/^# Changelog\r?\n/, '')
  .replace(/^All notable changes[\s\S]*?adheres to \[Semantic Versioning\]\([^)]+\)\.\r?\n/m, '')
  .trim();

writeFileSync(
  join(here, '..', 'src', 'content', 'docs', 'changelog.mdx'),
  `---
title: Changelog
description: Every notable change to @qubeejs/react.
editUrl: false
---

{/* Generated from CHANGELOG.md by scripts/generate-changelog.mjs — do not edit. */}

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

${mdx(body)}
`
);

console.log('  generated changelog.mdx');
