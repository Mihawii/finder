/** IRCC proof-of-funds table retrieved 2026-10-11; effective July 7, 2025. */
export const SETTLEMENT_FUNDS_RULE = Object.freeze({
  amounts: Object.freeze([15263, 19001, 23360, 28362, 32168, 36280, 40392]),
  additionalPerson: 4112,
  sourceUrl: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html",
  verifiedAt: "2026-10-11",
  effectiveAt: "2025-07-07",
});

/**
 * Express Entry FSW/FST funds comparison, not a universal PNP funds rule.
 * dependentChildren means all dependent children of either partner, counted
 * once, including those not accompanying or already Canadian citizens/PRs.
 * Pass { program: "cec" } only when evaluating that specific program. Canadian
 * work experience alone does not establish CEC eligibility or the exemption.
 */
export function assessSettlementFunds(profile = {}, { program = "fsw" } = {}) {
  profile = profile && typeof profile === "object" && !Array.isArray(profile) ? profile : {};
  // "Separated" alone does not establish the legal family composition.
  // Keep it unresolved for review instead of silently counting as single.
  const knownMarital = ["single", "married", "common_law", "divorced", "widowed"].includes(profile.maritalStatus);
  const partner = ["married", "common_law"].includes(profile.maritalStatus);
  const children = profile.dependentChildren;
  const familySize = knownMarital && Number.isInteger(children) && children >= 0
    ? 1 + (partner ? 1 : 0) + children : null;
  const required = familySize == null ? null : familySize <= 7
    ? SETTLEMENT_FUNDS_RULE.amounts[familySize - 1]
    : SETTLEMENT_FUNDS_RULE.amounts[6] + (familySize - 7) * SETTLEMENT_FUNDS_RULE.additionalPerson;
  const available = typeof profile.settlementFunds === "number" && Number.isFinite(profile.settlementFunds) && profile.settlementFunds >= 0
    ? profile.settlementFunds : null;
  const result = {
    status: "unknown", required, available, familySize,
    sourceUrl: SETTLEMENT_FUNDS_RULE.sourceUrl,
    verifiedAt: SETTLEMENT_FUNDS_RULE.verifiedAt,
    effectiveAt: SETTLEMENT_FUNDS_RULE.effectiveAt,
    program,
    exemption: null,
    comparison: required == null || available == null ? "unknown" : available >= required ? "sufficient" : "insufficient",
  };
  if (!["cec", "fsw", "fst"].includes(program)) return { ...result, reason: "This rule does not determine funds for the selected program." };
  if (program === "cec") return { ...result, status: "exempt", exemption: "cec" };
  if (profile.hasJobOffer === true && profile.workAuthorizedInCanada === true) {
    return { ...result, status: "exempt", exemption: "authorized_work_and_valid_offer" };
  }
  // Missing authorization with an offer is an unresolved exemption. Do not
  // declare someone ineligible merely because that answer is missing.
  if ((profile.hasJobOffer === true && profile.workAuthorizedInCanada == null)
    || (profile.hasJobOffer == null && profile.workAuthorizedInCanada !== false)) {
    return { ...result, reason: "Confirm valid job offer and authorization to work in Canada." };
  }
  return { ...result, status: result.comparison };
}
