import test from 'node:test';
import assert from 'node:assert/strict';
import { finalizeReport, parseReport, requirementState, scoreScenarios, validateReport } from '../functions/lib/report.js';
import { calcCRS } from '../functions/lib/assessment/crs.js';

const profile = {
  age: 30, maritalStatus: 'single', dependentChildren: 0, education: 'masters',
  foreignWorkYears: 3, canadianWorkYears: 0, hasSecondLang: false,
  clb: { reading: 8, writing: 8, listening: 8, speaking: 8 },
  hasJobOffer: false, workAuthorizedInCanada: null, settlementFunds: 20000,
};
const report = () => ({
  profile: { summary: 'Example assessment', strengths: [], gaps: [] },
  crs: { total: 999, competitiveness: 'Model opinion', keyInsight: 'Review language scores.' },
  pathways: [{ rank: 1, name: 'Federal Skilled Worker', stream: 'Express Entry', chance: 98,
    timeline: 'Varies', cost: 'Verify fees', status: 'active', why: 'Investigate the requirements.',
    requirements: [{ item: 'Occupation details', met: null }] }],
  actionPlan: [], costs: { total: 'Verify fees', items: [] }, timeline: [],
});

test('complete JSON is accepted; truncated prose is never repaired', () => {
  assert.equal(parseReport('```json\n{"a":1}\n```').a, 1);
  assert.throws(() => parseReport('{"pathways":['));
  assert.throws(() => parseReport('preface {"a":1}'));
});

test('schema rejects false completeness and malformed requirement values', () => {
  assert.equal(validateReport(report()).length, 0);
  assert.ok(validateReport({ profile: {} }).length);
  const malformed = report();
  malformed.pathways[0].requirements[0].met = 'true';
  assert.ok(validateReport(malformed).length);
  malformed.pathways = [];
  assert.equal(validateReport(malformed).length, 0, 'zero supported pathways is valid');
});

test('requirement status preserves uncertainty without eligibility claims', () => {
  assert.equal(requirementState({ requirements: [] }), 'Needs review');
  assert.equal(requirementState({ requirements: [{ met: null }] }), 'Missing information');
  assert.equal(requirementState({ requirements: [{ met: true }] }), 'Review requirements');
  assert.equal(requirementState({ requirements: [{ met: false }] }), 'Gaps identified');
});

test('canonical report recalculates scores, removes probabilities and dates stale claims', () => {
  const original = report();
  const result = finalizeReport(original, profile, { dataAsOf: '2020-01-01' });
  assert.equal(result.crs.total, calcCRS(profile).total);
  assert.equal('chance' in result.pathways[0], false);
  assert.equal(result.pathways[0].status, 'unverified');
  assert.match(result.dataDisclaimer, /2020-01-01/);
  assert.equal(original.pathways[0].chance, 98, 'input is not mutated');
});

test('combined language scenario recalculates shared caps instead of adding gains', () => {
  const result = scoreScenarios(profile);
  const modified = { ...profile, clb: { reading: 9, writing: 9, listening: 9, speaking: 9 },
    hasSecondLang: true, clb2: { reading: 7, writing: 7, listening: 7, speaking: 7 } };
  assert.equal(result.projectedTotal, calcCRS(modified).total);
  assert.ok(result.opportunities.every(item => item.pointsGain > 0));
  const fluent = { ...profile, clb: { reading: 10, writing: 10, listening: 10, speaking: 10 },
    hasSecondLang: true, clb2: { reading: 10, writing: 10, listening: 10, speaking: 10 } };
  assert.deepEqual(scoreScenarios(fluent).opportunities, []);
  assert.equal(scoreScenarios(fluent).projectedTotal, calcCRS(fluent).total);
});

test('funds conclusions use canonical conditional rule, including unresolved exemption', () => {
  const original = report();
  original.pathways[0].requirements = [{ item: 'Proof of funds: $19,001 minimum for a family of 2', met: true }];
  original.profile.gaps = ['Settlement funds are sufficient, not a gap.'];
  const result = finalizeReport(original, { ...profile, settlementFunds: 10 });
  assert.equal(result.pathways[0].requirements[0].met, false);
  assert.doesNotMatch(result.pathways[0].requirements[0].item, /19,001|family of 2/);
  assert.equal(result.profile.gaps.length, 1);
  assert.match(result.profile.gaps[0], /^If proof of funds/);
  const uncertain = finalizeReport(original, { ...profile, settlementFunds: 10, hasJobOffer: true });
  assert.equal(uncertain.pathways[0].requirements[0].met, null);
  assert.equal(uncertain.assessment.funds.status, 'unknown');
});
