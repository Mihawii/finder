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
  stdin: { contents: `${source}\nexport { ResultsPage, AssessmentFlow, PreparationFlow };\nexport { ReportBudget } from "./src/report-view.jsx";`, sourcefile: sourcePath, resolveDir: root, loader: 'jsx' },
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  packages: 'external', alias: { '@': root }, loader: { '.css': 'empty' },
  define: { 'import.meta.env': '{}' }, logLevel: 'silent',
});
const require = createRequire(sourcePath);
const componentModule = { exports: {} };
new Function('require', 'module', 'exports', compiled.outputFiles[0].text)(
  require, componentModule, componentModule.exports,
);
const { ResultsPage, ReportBudget, AssessmentFlow, PreparationFlow } = componentModule.exports;

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
  return renderToStaticMarkup(React.createElement(ResultsPage, {
    report: parsedReport ? JSON.stringify(parsedReport) : '',
    profile, breakdown: calcCRS(profile), calcCRS,
  }));
}

test('results show only the pending state before a report arrives', () => {
  const html = render(undefined);
  assert.match(html, /Finding your pathways/);
  assert.doesNotMatch(html, /Estimated costs|Your CRS score/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('loaded report renders item amounts and proportional cost bars', () => {
  const html = renderToStaticMarkup(React.createElement(ReportBudget, { report: report({ total: '$3,000', items: [{ name: 'Example main cost', amount: 2000 }, { name: 'Example smaller cost', amount: 1000 }] }) }));
  assert.match(html, /\$3,000/);
  assert.match(html, /Example main cost/);
  assert.match(html, /width:100%/);
  assert.match(html, /width:50%/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('loaded report preserves a nonnumeric estimate when no fee amounts are verified', () => {
  const html = renderToStaticMarkup(React.createElement(ReportBudget, { report: report({ total: 'Verify current official fees', items: [] }) }));
  assert.match(html, /Verify current official fees/);
  assert.doesNotMatch(html, /NaN|undefined/);
});

test('loaded results open on the profile without rendering other chapters', () => {
  const html = render(report({ total: '$3,000', items: [{ name: 'Example cost', amount: 3000 }] }));
  assert.match(html, /Rendering regression fixture/);
  assert.match(html, /Report chapters/);
  assert.doesNotMatch(html, /Example cost|What changes for you|Your stated settlement funds|NaN|undefined/);
});

test('zero cost amounts do not produce invalid bar widths', () => {
  const html = renderToStaticMarkup(React.createElement(ReportBudget, { report: report({ total: '$0', items: [{ name: 'No fee', amount: 0 }] }) }));
  assert.match(html, /width:0%/);
  assert.doesNotMatch(html, /NaN|Infinity|undefined/);
});

test('assessment renders a single active question with section navigation', () => {
  const html = renderToStaticMarkup(React.createElement(AssessmentFlow));
  assert.match(html, /Assessment sections/);
  assert.match(html, /name="age"/);
  assert.doesNotMatch(html, /name="dependentChildren"|name="maritalStatus"|name="citizenship"/);
});

test('preparation begins with only the destination question and a usable next action', () => {
  const html = renderToStaticMarkup(React.createElement(PreparationFlow, { assessmentProfile: { provincialNomination: 'Yes', nominationType: 'Express Entry' } }));
  assert.match(html, /preparation-route-destination/);
  assert.doesNotMatch(html, /name="route.adult"|name="route.process"|name="identity.fullName"/);
  assert.match(html, /<button type="submit" class="pathway-button pathway-button--primary">Continue/);
});
