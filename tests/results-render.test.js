import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { calcCRS } from '../functions/lib/assessment/crs.js';
import { finalizeReport } from '../functions/lib/report.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = path.join(root, 'pathwayfinder-app (2).jsx');
const source = await readFile(sourcePath, 'utf8');
const compiled = await build({
  stdin: { contents: `${source}\nexport { ResultsPage };`, sourcefile: sourcePath, resolveDir: root, loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' },
  define: { 'import.meta.env': '{}' }, logLevel: 'silent',
});
const require = createRequire(sourcePath);
let stateIndex = 0;
let reportState;
// SSR does not run effects. Seed only ResultsPage's first (parsed-report) state
// so both the real initial render and the post-response render are exercised.
// All remaining hooks, JSX and child components use React's actual renderer.
const hooks = { ...React, useState(initial) {
  const seed = stateIndex++ === 0 && reportState !== undefined ? reportState : initial;
  return React.useState(seed);
} };
const componentModule = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
  name => name === 'react' ? hooks : require(name), componentModule, componentModule.exports,
);
const { ResultsPage } = componentModule.exports;

const profile = {
  age: 30, maritalStatus: 'single', dependentChildren: 0, education: 'masters',
  foreignWorkYears: 3, canadianWorkYears: 0, hasSecondLang: false,
  clb: { reading: 8, writing: 8, listening: 8, speaking: 8 },
  hasJobOffer: false, workAuthorizedInCanada: null, settlementFunds: 20000,
};
function report(costs) {
  return finalizeReport({
    profile: { summary: 'Rendering regression fixture', strengths: [], gaps: [] },
    crs: { keyInsight: 'Review your answers.', competitiveness: 'Requires verification.' },
    pathways: [], actionPlan: [], timeline: [], costs,
  }, profile);
}
function render(parsedReport) {
  reportState = parsedReport;
  stateIndex = 0;
  return renderToStaticMarkup(React.createElement(ResultsPage, {
    report: parsedReport ? JSON.stringify(parsedReport) : '',
    profile, breakdown: calcCRS(profile), calcCRS,
  }));
}

test('results render before a report arrives without undefined cost values', () => {
  const html = render(undefined);
  assert.match(html, /Estimated costs/);
  assert.match(html, /Your profile summary will appear here/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('loaded report renders item amounts and proportional cost bars', () => {
  const html = render(report({ total: '$3,000', items: [{ name: 'Example main cost', amount: 2000 }, { name: 'Example smaller cost', amount: 1000 }] }));
  assert.match(html, /Rendering regression fixture/);
  assert.match(html, /\$3,000/);
  assert.match(html, /Example main cost/);
  assert.match(html, /width:100%/);
  assert.match(html, /width:50%/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('loaded report preserves a nonnumeric estimate when no fee amounts are verified', () => {
  const html = render(report({ total: 'Verify current official fees', items: [] }));
  assert.match(html, /Verify current official fees/);
  assert.doesNotMatch(html, /NaN|undefined/);
});
