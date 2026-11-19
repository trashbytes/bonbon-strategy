// Proves that two versions of `bonbon-strategy-styles.js` render the same CSS.
//
//   node scripts/css-equivalence.mjs <baseline-module> <candidate-module>
//
// Both arguments are paths to a copy of the styles module (export a copy of the file you are about to
// refactor, then point the second argument at the working file). The script loads them headlessly,
// renders `getVariables()` and every fragment of `getStyles()` for a light and a styled config, and
// compares the result rule by rule.
//
// Comparison rules that make this a proof of "no optical change" rather than a text diff:
// - CSS whitespace is insignificant, so all whitespace is collapsed first. Rebuilding a selector list
//   from an array therefore passes, while a changed declaration, value, `!important` or rule order fails.
// - A selector listed twice inside one rule is a no-op, so per-rule selector parts are deduplicated.
//
// Exit code 0 means identical; 1 prints the first diverging rules per fragment.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

globalThis.document = { querySelector: () => null };

const CONFIGS = [
  { styles: {} },
  {
    styles: {
      background_image_light: 'light.jpg',
      background_image_dark: 'dark.jpg',
      card_text_color_light: '#111',
      card_text_color_dark: '#eee',
      card_background_color_light: '#fafafa',
      card_background_color_dark: '#101010',
      primary_accent_color_light: '#ff9900',
      primary_accent_color_dark: '#ffaa11',
    },
  },
];

const normalize = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,])\s*/g, '$1')
    .trim();

const dedupeParts = (rule) => {
  const brace = rule.indexOf('{');
  if (brace < 0 || rule.startsWith('@')) return rule;
  const seen = new Set();
  const parts = [];
  for (const part of rule.slice(0, brace).split(',')) {
    const trimmed = part.trim();
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      parts.push(trimmed);
    }
  }
  return parts.join(',') + rule.slice(brace);
};

const rules = (css) => {
  const flat = normalize(css);
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < flat.length; i++) {
    if (flat[i] === '{') depth++;
    else if (flat[i] === '}' && --depth === 0) {
      out.push(dedupeParts(flat.slice(start, i + 1)));
      start = i + 1;
    }
  }
  if (start < flat.length) out.push(dedupeParts(flat.slice(start)));
  return out.filter(Boolean);
};

const load = async (path) => {
  const url = pathToFileURL(resolve(path)).href + '?v=' + Date.now();
  return await import(url);
};

const [baselinePath, candidatePath] = process.argv.slice(2);
if (!baselinePath || !candidatePath) {
  console.error('usage: node scripts/css-equivalence.mjs <baseline-module> <candidate-module>');
  process.exit(2);
}

const baseline = await load(baselinePath);
const candidate = await load(candidatePath);
let failures = 0;
const fail = (message) => {
  failures++;
  console.log(message);
};

// 1. The CSS variables both versions write for light and dark mode.
CONFIGS.forEach((config, index) => {
  const label = `getVariables[${index}]`;
  const a = JSON.stringify(baseline.createStylesApi('p', config).getVariables());
  const b = JSON.stringify(candidate.createStylesApi('p', config).getVariables());
  if (a === b) {
    console.log(`OK   ${label}`);
    return;
  }
  fail(`DIFF ${label}`);
  fail(`  base: ${a.slice(0, 300)}`);
  fail(`  cand: ${b.slice(0, 300)}`);
});

// 2. Every fragment `bonbon_styles` can reference by name.
const stylesA = baseline.createStylesApi('p', CONFIGS[0]).getStyles();
const stylesB = candidate.createStylesApi('p', CONFIGS[0]).getStyles();
for (const name of [...new Set([...Object.keys(stylesA), ...Object.keys(stylesB)])]) {
  if (!(name in stylesA) || !(name in stylesB)) {
    fail(`MISSING fragment ${name} in ${name in stylesA ? 'candidate' : 'baseline'}`);
    continue;
  }
  const a = rules(stylesA[name]);
  const b = rules(stylesB[name]);
  if (a.join('') === b.join('')) {
    console.log(`OK   ${name.padEnd(38)} ${String(a.length).padStart(3)} rules`);
    continue;
  }
  fail(`DIFF ${name.padEnd(38)} base ${a.length} rules / candidate ${b.length} rules`);
  let shown = 0;
  for (let i = 0; i < Math.max(a.length, b.length) && shown < 6; i++) {
    if (a[i] !== b[i]) {
      fail(`  [${i}] base: ${(a[i] || '<none>').slice(0, 200)}`);
      fail(`  [${i}] cand: ${(b[i] || '<none>').slice(0, 200)}`);
      shown++;
    }
  }
  if (shown === 0) fail('  ordering difference only');
}

console.log(failures === 0 ? '\nRESULT: IDENTICAL' : `\nRESULT: ${failures} difference(s)`);
process.exit(failures === 0 ? 0 : 1);
