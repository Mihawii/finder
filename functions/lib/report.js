import { calcCRS } from './assessment/crs.js';
import { assessSettlementFunds } from './assessment/funds.js';

export const REPORT_VERSION = '2.0';
const abilities = ['reading', 'writing', 'listening', 'speaking'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const text = value => typeof value === 'string';

// Parse complete JSON only. Closing truncated JSON can silently invent a complete report.
export function parseReport(value) {
  if (object(value)) return value;
  if (!text(value)) throw new Error('Invalid report');
  return JSON.parse(value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
}

export function validateReport(report) {
  const issues = [];
  if (!object(report)) return ['Report must be an object'];
  if (!object(report.profile) || !text(report.profile.summary) || !strings(report.profile.strengths) || !strings(report.profile.gaps)) issues.push('Invalid profile summary');
  if (!object(report.crs) || !text(report.crs.keyInsight) || !text(report.crs.competitiveness)) issues.push('Invalid CRS explanation');
  if (!Array.isArray(report.pathways) || report.pathways.length > 5 || report.pathways.some(pathway =>
    !object(pathway) || !text(pathway.name) || !text(pathway.stream) || !text(pathway.why) ||
    !text(pathway.timeline) || !text(pathway.cost) || !['active', 'limited', 'changing', 'requires_action', 'unverified'].includes(pathway.status) ||
    !Array.isArray(pathway.requirements) || pathway.requirements.some(requirement => !object(requirement) || !text(requirement.item) || ![true, false, null].includes(requirement.met)) ||
    (pathway.details !== undefined && (!object(pathway.details) || !strings(pathway.details.applicationProcess) ||
      ['description', 'processingTime', 'officialLink', 'alternatives', 'improvementTips'].some(key => !text(pathway.details[key])))))) issues.push('Invalid pathway requirements');
  if (!Array.isArray(report.actionPlan) || report.actionPlan.some(item => !object(item) || ['action', 'where', 'cost', 'time', 'priority'].some(key => !text(item[key])))) issues.push('Invalid action plan');
  if (!object(report.costs) || !text(report.costs.total) || !Array.isArray(report.costs.items) || report.costs.items.some(item => !object(item) || !text(item.name) || !Number.isFinite(item.amount) || item.amount < 0)) issues.push('Invalid costs');
  if (!Array.isArray(report.timeline) || report.timeline.some(item => !object(item) || ['month', 'label', 'tasks'].some(key => !text(item[key])))) issues.push('Invalid timeline');
  return issues;
}

export function requirementState(pathway) {
  const requirements = pathway?.requirements;
  if (!Array.isArray(requirements) || requirements.length === 0) return 'Needs review';
  if (requirements.some(item => item?.met === false)) return 'Gaps identified';
  if (requirements.some(item => item?.met !== true)) return 'Missing information';
  return 'Review requirements';
}

export function scoreCategories(profile) {
  const spouse = ['married', 'common_law'].includes(profile.maritalStatus) && profile.spouseAccompanying && !profile.spouseIsCitizenPR;
  return [
    ['age', 'Age', spouse ? 100 : 110], ['education', 'Education', spouse ? 140 : 150],
    ['firstLanguage', 'First language', spouse ? 128 : 136], ['secondLanguage', 'Second language', spouse ? 22 : 24],
    ['canadianWork', 'Canadian work', spouse ? 70 : 80], ['spouse', 'Spouse factors', spouse ? 40 : 0],
    ['skillTransfer', 'Skill transferability', 100], ['additional', 'Additional points', 600],
  ].map(([key, label, max]) => ({ key, label, max }));
}

export function scoreScenarios(profile) {
  const current = calcCRS(profile).total;
  const atLeast = (scores, target) => Object.fromEntries(abilities.map(key => [key, Math.max(scores?.[key] || 0, target)]));
  const changes = [
    { id: 'english', action: 'Reach at least CLB 9 in each English ability', difficulty: 'medium', apply: p => ({ ...p, clb: atLeast(p.clb, 9) }) },
    { id: 'french', action: 'Reach at least NCLC 7 in each French ability', difficulty: 'hard', apply: p => ({ ...p, hasSecondLang: true, clb2: atLeast(p.clb2, 7) }) },
  ];
  const opportunities = changes.map(change => {
    const projected = calcCRS(change.apply(profile)).total;
    return { id: change.id, action: change.action, pointsGain: projected - current, difficulty: change.difficulty,
      timeframe: 'Depends on your starting level', cost: 'Check local course and test fees',
      explanation: 'Calculated with your other answers unchanged. A scenario is not a prediction or a recommendation to spend money.' };
  }).filter(item => item.pointsGain > 0).sort((a, b) => b.pointsGain - a.pointsGain);
  const combined = changes.reduce((next, change) => change.apply(next), profile);
  const projectedTotal = calcCRS(combined).total;
  return { opportunities, projectedTotal, projectedScore: `If English reaches at least CLB 9 and French at least NCLC 7 in every ability, the calculated score is ${projectedTotal}. Both changes are calculated together; individual gains must not be added.` };
}

// The model owns explanatory prose. Calculated numbers and report metadata are code-owned.
export function finalizeReport(input, profile, { dataAsOf = null } = {}) {
  const report = structuredClone(input);
  const issues = validateReport(report);
  if (issues.length) throw new Error('The report was incomplete. Please try again.');
  const breakdown = calcCRS(profile);
  const scenarios = scoreScenarios(profile);
  const funds = assessSettlementFunds(profile);
  const dataStale = !dataAsOf || !Number.isFinite(Date.parse(dataAsOf)) || Date.now() - Date.parse(dataAsOf) > 30 * 86400000;
  const losses = scoreCategories(profile).filter(item => item.max - breakdown[item.key] > 10).map(item => ({
    category: item.label, currentPoints: breakdown[item.key], maxPoints: item.max, pointsLost: item.max - breakdown[item.key],
    explanation: 'Difference from this scoring category’s maximum. This is not a missing eligibility requirement.',
    fixable: ['firstLanguage', 'secondLanguage', 'canadianWork', 'spouse', 'skillTransfer'].includes(item.key),
  }));
  report.crs.total = breakdown.total;
  report.crs.competitiveness = 'CRS ranks Express Entry profiles. Eligibility and competitiveness require separate checks against current program rules and relevant invitation rounds.';
  report.scoreAnalysis = { losses, ...scenarios };
  report.pathways = report.pathways.map((pathway, index) => {
    const { chance, ...rest } = pathway;
    const details = rest.details && { ...rest.details, officialLink: /^https:\/\//i.test(rest.details.officialLink) ? rest.details.officialLink : '' };
    const requirements = rest.requirements.map(requirement => {
      if (!/settlement fund|proof of funds/i.test(requirement.item)) return requirement;
      // Only apply Express Entry funds rules to explicitly identified federal programs.
      const program = /canadian experience class|\bCEC\b/i.test(rest.name) ? 'cec' : /federal skilled (worker|trades)|\bFS[WT]\b/i.test(rest.name) ? 'funds' : null;
      const item = program === 'cec' ? 'Proof of funds is not required for the Canadian Experience Class.'
        : program === 'funds' ? 'Proof of funds — review the family-size comparison and any applicable exemption in the funds check.'
          : 'Proof of funds — verify this route’s specific requirements.';
      return { item, met: program === 'cec' ? true : program === 'funds' && ['sufficient', 'exempt'].includes(funds.status) ? true : program === 'funds' && funds.status === 'insufficient' ? false : null };
    });
    return { ...rest, details, requirements, status: dataStale ? 'unverified' : rest.status,
      rank: index + 1, requirementState: requirementState({ requirements }) };
  });
  // Model-written funds summaries can contradict the canonical calculation.
  const mentionsFunds = value => /settlement fund|proof of funds/i.test(value);
  report.profile.gaps = report.profile.gaps.filter(value => !mentionsFunds(value));
  report.profile.strengths = report.profile.strengths.filter(value => !mentionsFunds(value));
  report.actionPlan = report.actionPlan.filter(item => !mentionsFunds(item.action));
  if (funds.status === 'insufficient') {
    const gap = `If proof of funds is required for your route, the stated funds are below the Express Entry minimum for your family size. Review the funds check before applying.`;
    report.profile.gaps.unshift(gap);
    report.actionPlan.unshift({ step: 1, action: 'Check whether your selected route requires proof of funds and resolve any shortfall.', where: funds.sourceUrl, cost: 'Depends on the shortfall', time: 'Before applying', priority: 'high' });
  }
  report.actionPlan = report.actionPlan.map((item, index) => ({ ...item, step: index + 1 }));
  report.assessment = { version: REPORT_VERSION, destination: 'ca', breakdown, funds, dataAsOf, dataStale,
    limitations: ['Program requirements are AI-assisted explanations and need verification.', 'This report does not establish eligibility or an approval probability.'] };
  report.dataDisclaimer = dataAsOf
    ? `Program data last fetched ${dataAsOf}. This is not a live update. Verify current requirements before acting.`
    : 'The program-data verification date is unavailable. Verify current requirements before acting.';
  return report;
}
