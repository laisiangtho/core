import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parseCategory } from '../app/core/category.js';

export const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
export const readJson = (p) => JSON.parse(readFileSync(root(p), 'utf8'));
export const category = parseCategory(readJson('public/category.json'));
export const clone = (v) => structuredClone(v);
