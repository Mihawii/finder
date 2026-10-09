// ============================================================
// DEV CONFIG — PathwayFinder
// Set `enabled: true` to activate dev mode.
//
// Dev mode:
//  - Skips the disclaimer modal
//  - Jumps straight to the assessment form
//  - Pre-fills all form fields with the profile below
//  - Returns a mock AI report (no real API call)
// ============================================================

const DEV_CONFIG = {
  enabled: false,

  // ── Pre-filled profile ─────────────────────────────────────
  // Matches the shape of `initialProfile` in the app.
  // Edit any field to test different scenarios.
  profile: {
    age: "32",
    maritalStatus: "married",
    spouseAccompanying: true,
    spouseIsCitizenPR: false,
    dependentChildren: 1,
    citizenship: "india",
    currentCountry: "",

    education: "masters",
    fieldOfStudy: "",
    educationCountry: "foreign",
    canadianCredential: false,
    ecaObtained: true,

    firstLangTest: "ielts",
    firstLangScores: { reading: 7.5, writing: 7.0, listening: 8.0, speaking: 7.0 },

    hasSecondLang: false,
    secondLangTest: "tef",
    secondLangScores: { reading: "", writing: "", listening: "", speaking: "" },

    foreignWorkYears: "5",
    canadianWorkYears: "1",
    primaryNoc: "",
    nocTeer: "1",

    inCanada: true,
    currentProvince: "ON",
    currentWorkPermitType: "pgwp",
    monthsWithEmployer: "12",

    siblingInCanada: false,
    previousCanadianEducation: false,
    canadianEducationYears: 0,
    previousCanadianWork: false,
    provincePreference: "ON",
    settlementFunds: "50000",
    provincialNomination: false,

    hasJobOffer: false,
    spouseEducation: "bachelors",
    spouseClbScores: { reading: "", writing: "", listening: "", speaking: "" },
    spouseCanadianWorkYears: "0",
    spouseLangTest: "ielts",

    previousRefusals: false,
    criminalHistory: false,
    medicalConditions: false,
    quebecIntent: false,
    openToStudy: false,
    openToAnyProvince: true,
  },

  // ── Mock AI report ─────────────────────────────────────────
  // Shown instead of a real API call in dev mode.
  // Must be valid JSON string matching the report schema.
  // Edit freely to test how different reports render.
  mockReport: JSON.stringify({
    profile: {
      summary: "Indian national, age 32, married with one dependent child. Holds a Master's degree with ECA (Educational Credential Assessment) obtained, 5 years of foreign skilled work experience (TEER 1), and 1 year of Canadian work experience. Currently in Ontario on a PGWP (Post-Graduation Work Permit) with 12 months at current employer. IELTS scores translate to CLB (Canadian Language Benchmark) 9 across all abilities — a strong language profile.",
      strengths: [
        "CLB 9 across all abilities — qualifies for maximum language CRS points and all Express Entry programs",
        "Master's degree with valid ECA — strong education factor worth 126 CRS points",
        "1 year Canadian work experience — eligible for CEC (Canadian Experience Class) and skill transferability crossover points",
        "Currently employed in Ontario for 12+ months — meets Ontario OINP employer-based stream residency requirements",
        "Settlement funds of $50,000 — well above the $23,360 required for a family of 3"
      ],
      gaps: [
        "CRS score of ~487 is 22 points below the CEC general draw cutoff of 509-511 — not competitive for general draws without a provincial nomination",
        "No French language proficiency — missing 25-50 bonus CRS points that could push score above the CEC threshold",
        "PGWP is a temporary status — must secure PR pathway before it expires to maintain legal status in Canada"
      ]
    },
    crs: {
      total: 487,
      competitiveness: "Your CRS score of 487 places you below the recent CEC (Canadian Experience Class) all-program draw cutoffs of 509-511. You would not receive an ITA (Invitation to Apply) in a general draw at this score. However, you are competitive for category-based draws in STEM (480-510 range) and well-positioned for provincial nominee programs, which add 600 points to your score.",
      keyInsight: "A PNP (Provincial Nominee Program) nomination is your fastest path to an ITA. With a nomination, your effective CRS becomes 1,087 — well above any draw cutoff. Focus your efforts on Ontario OINP or Alberta AAIP, both of which match your profile."
    },
    scoreAnalysis: {
      losses: [
        { category: "Age", currentPoints: 77, maxPoints: 110, pointsLost: 33, explanation: "At age 32, you're losing 33 points compared to someone aged 20-29 who would receive the maximum 110 points.", fixable: false },
        { category: "Second Language", currentPoints: 0, maxPoints: 24, pointsLost: 24, explanation: "You have no French language proficiency. French at NCLC 7+ would add up to 24 CRS points plus make you eligible for French-language draws.", fixable: true },
        { category: "Skill Transferability", currentPoints: 50, maxPoints: 100, pointsLost: 50, explanation: "You're getting 50/100 skill transferability points. Additional Canadian work experience or higher language scores would unlock more crossover points.", fixable: true },
        { category: "Additional Points", currentPoints: 0, maxPoints: 600, pointsLost: 600, explanation: "No provincial nomination (600 pts), no Canadian sibling (15 pts). A PNP nomination alone would add 600 points.", fixable: true }
      ],
      opportunities: [
        { action: "Get a Provincial Nomination (OINP or AAIP)", pointsGain: 600, difficulty: "hard", timeframe: "6-12 months", cost: "$500-$2,000", explanation: "A provincial nomination adds 600 CRS points, virtually guaranteeing an ITA. Your profile is competitive for Ontario OINP Masters Graduate stream and Alberta AAIP Express Entry stream." },
        { action: "Learn French to NCLC 7 in all abilities", pointsGain: 50, difficulty: "hard", timeframe: "6-12 months", cost: "$2,000-4,000", explanation: "French proficiency at NCLC 7+ adds 25-50 bonus CRS points AND makes you eligible for French-language draws with cutoffs as low as 379." },
        { action: "Gain additional Canadian work experience (2+ years total)", pointsGain: 27, difficulty: "medium", timeframe: "12 months", cost: "N/A", explanation: "Going from 1 to 2 years of Canadian skilled work adds approximately 27 CRS points and strengthens skill transferability crossover points." },
        { action: "Improve IELTS Writing to 8.0+ (CLB 10)", pointsGain: 8, difficulty: "easy", timeframe: "1-2 months", cost: "$320", explanation: "Your Writing is at 7.0 (CLB 9). Scoring 8.0+ would push it to CLB 10, adding approximately 8 more CRS first language points." }
      ],
      projectedScore: "If you obtain a provincial nomination (+600 pts), your CRS would jump from 487 → 1,087, well above any draw cutoff. Even without PNP, improving French to NCLC 7 (+50 pts) and gaining more Canadian work experience (+27 pts) could bring you to ~564, above the CEC cutoff of 509-511."
    },
    pathways: [
      {
        rank: 1,
        name: "Ontario Immigrant Nominee Program (OINP)",
        stream: "Masters Graduate Stream",
        chance: 68,
        timeline: "10-16 months total",
        cost: "$3,500 - $4,200",
        status: "changing",
        why: "You hold a Master's degree and have been working in Ontario for 12+ months, which meets the core eligibility criteria. Ontario has 14,119 PNP spots in 2026 — the largest allocation of any province. However, OINP is undergoing a major redesign (Phase 1 Spring 2026, Phase 2 Late 2026), so program requirements may shift. Apply early before changes take effect.",
        requirements: [
          { item: "Master's degree or PhD from eligible institution", met: true },
          { item: "Legal status in Canada (PGWP qualifies)", met: true },
          { item: "Intent to live and work in Ontario", met: true },
          { item: "Meet language requirement (CLB 7+)", met: true },
          { item: "OINP registration and Expression of Interest submitted", met: false },
          { item: "Settlement funds demonstrated", met: true }
        ],
        details: {
          description: "The OINP Masters Graduate Stream allows international students who graduated with a Master's degree from an eligible Ontario university to apply for provincial nomination without a job offer.",
          applicationProcess: ["Complete your Master's degree at an eligible Ontario institution", "Create an OINP account and submit Expression of Interest", "Wait for notification of interest from OINP", "Submit full application within 45 days of receiving invitation", "Receive provincial nomination and apply for PR through Express Entry"],
          processingTime: "60-90 days for OINP nomination, then 6 months for federal PR",
          officialLink: "https://www.ontario.ca/page/oinp-masters-graduate-stream",
          alternatives: "If OINP Masters stream is eliminated in late 2026 redesign, consider the OINP Employer Job Offer streams (merging Spring 2026) or Alberta AAIP Express Entry stream.",
          improvementTips: "Submit your EOI as early as possible before the redesign. Keep your Express Entry profile active to benefit from the 600-point PNP boost."
        }
      },
      {
        rank: 2,
        name: "Alberta Advantage Immigration Program (AAIP)",
        stream: "Express Entry Stream",
        chance: 72,
        timeline: "8-14 months total",
        cost: "$2,400 - $3,100",
        status: "active",
        why: "Alberta's EE stream has no minimum CRS floor and actively targets TEER 0-1 professionals. Their Tech Pathway processes applications in approximately 1 month. With your Master's degree, CLB 9, and 5 years of skilled experience, you are a strong candidate. You would need to demonstrate genuine intent to settle in Alberta. The program has 6,403 spots for 2026.",
        requirements: [
          { item: "Active Express Entry profile", met: false },
          { item: "CRS 300+ (you have ~487)", met: true },
          { item: "Skilled work experience in eligible occupation", met: true },
          { item: "CLB 5+ (you have CLB 9)", met: true },
          { item: "Intent to live in Alberta", met: false },
          { item: "Alberta AAIP Expression of Interest submitted", met: false }
        ],
        details: {
          description: "Alberta's EE stream targets skilled workers already in Canada's Express Entry pool. The Tech Pathway fast-tracks applications for tech workers in approximately 1 month.",
          applicationProcess: ["Create an Express Entry profile on IRCC", "Submit an Expression of Interest to AAIP", "Receive a Notification of Interest from Alberta", "Submit full AAIP application", "Receive provincial nomination (+600 CRS) and apply for PR"],
          processingTime: "1-3 months for AAIP nomination (Tech Pathway ~1 month), then 6 months federal",
          officialLink: "https://www.alberta.ca/aaip-alberta-express-entry-stream",
          alternatives: "Saskatchewan SINP also has an EE-linked stream with lower competition. BC PNP Skilled Worker stream is another option if you're open to relocating.",
          improvementTips: "Demonstrate strong ties to Alberta — research employers, job market, and settlement plans. The Tech Pathway is fastest if your NOC is tech-eligible."
        }
      },
      {
        rank: 3,
        name: "Express Entry",
        stream: "Canadian Experience Class (CEC)",
        chance: 35,
        timeline: "6-10 months if score reaches cutoff",
        cost: "$1,800 - $2,400",
        status: "limited",
        why: "You are eligible for CEC with 1 year of Canadian skilled work experience and CLB 9. However, your CRS of ~487 is currently below the draw cutoff of 509-511. You would need to gain approximately 22+ additional points through additional Canadian work experience, improving language scores further, or waiting for a category-based draw (STEM draws had cutoffs of 480-510 but were rare in 2025).",
        requirements: [
          { item: "1 year Canadian skilled work in last 3 years", met: true },
          { item: "CLB 7+ for TEER 0-1 occupation", met: true },
          { item: "Active Express Entry profile", met: false },
          { item: "CRS score at or above draw cutoff (509-511)", met: false }
        ],
        details: {
          description: "CEC is an Express Entry program for people who have gained skilled Canadian work experience. No settlement funds or ECA required.",
          applicationProcess: ["Create Express Entry profile on IRCC portal", "Receive ITA when your CRS meets or exceeds draw cutoff", "Submit complete PR application within 60 days", "Complete medical exam and police certificates", "Receive Confirmation of PR"],
          processingTime: "6 months from ITA to PR (standard Express Entry)",
          officialLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/canadian-experience-class.html",
          alternatives: "If your CRS remains below 509, pursue a PNP nomination to add 600 points. French language draws have cutoffs as low as 379.",
          improvementTips: "Gain more Canadian work experience (2 years = +11 CRS). Improve IELTS to CLB 10 in all abilities for maximum language points."
        }
      },
      {
        rank: 4,
        name: "Federal Skilled Worker (FSW)",
        stream: "Express Entry - Federal Skilled Worker",
        chance: 30,
        timeline: "6-10 months if score reaches cutoff",
        cost: "$2,200 - $3,000",
        status: "active",
        why: "You meet all FSW eligibility requirements: 1+ year skilled work (TEER 0-3), CLB 7+, valid ECA, and sufficient settlement funds. Like CEC, the challenge is your CRS score being below general draw cutoffs. FSW is your backup if CEC eligibility lapses (your Canadian work experience must be within the last 3 years).",
        requirements: [
          { item: "1 year skilled work experience (TEER 0-3)", met: true },
          { item: "CLB 7+ in all abilities", met: true },
          { item: "Educational Credential Assessment (ECA)", met: true },
          { item: "67/100 FSW selection grid points", met: true },
          { item: "Settlement funds ($23,360 for family of 3)", met: true },
          { item: "CRS at or above draw cutoff", met: false }
        ],
        details: {
          description: "FSW is for skilled workers with foreign work experience. Requires minimum 67/100 on the FSW selection grid (age, education, language, work experience, arranged employment, adaptability).",
          applicationProcess: ["Obtain ECA for your foreign degree", "Take approved language test (IELTS/CELPIP/PTE)", "Create Express Entry profile", "Receive ITA and submit PR application within 60 days", "Complete medical and police checks"],
          processingTime: "6 months standard Express Entry processing",
          officialLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/federal-skilled-workers.html",
          alternatives: "CEC is preferred if you have Canadian work experience since it doesn't require ECA or settlement funds. PNP streams are your best bet if CRS is below 509.",
          improvementTips: "FSW is your fallback if CEC eligibility lapses. Keep your ECA and language scores current."
        }
      },
      {
        rank: 5,
        name: "Atlantic Immigration Program (AIP)",
        stream: "Skilled Worker",
        chance: 25,
        timeline: "12-18 months",
        cost: "$2,000 - $2,800",
        status: "requires_action",
        why: "AIP is a viable backup if you are open to relocating to Atlantic Canada (Nova Scotia, New Brunswick, Newfoundland, or PEI). It requires a job offer from a designated employer. Note that New Brunswick employer designations are currently paused as of February 2026. The program has approximately 4,000 spots with ~8 months processing time.",
        requirements: [
          { item: "Job offer from designated Atlantic employer", met: false },
          { item: "1 year skilled work experience", met: true },
          { item: "CLB 5+ (you have CLB 9)", met: true },
          { item: "ECA for foreign education", met: true },
          { item: "Settlement needs assessment", met: false },
          { item: "Willingness to relocate to Atlantic Canada", met: false }
        ],
        details: {
          description: "AIP is a direct-to-IRCC program (not a PNP) for Atlantic provinces. Requires a job offer from a designated employer and a settlement needs assessment.",
          applicationProcess: ["Find a designated employer in Atlantic Canada", "Receive a job offer and employer endorsement", "Complete a settlement needs assessment", "Apply directly to IRCC for PR", "Receive Confirmation of PR"],
          processingTime: "Approximately 8 months",
          officialLink: "https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/atlantic-immigration.html",
          alternatives: "If you can't find an Atlantic employer, focus on AAIP or OINP instead. Provincial employer-linked streams in other provinces are another option.",
          improvementTips: "Network with Atlantic Canadian employers. NB designations are paused, so focus on NS, NL, or PEI."
        }
      }
    ],
    actionPlan: [
      {
        step: 1,
        action: "Create your Express Entry profile on the IRCC portal — this is required for both CEC/FSW draws and provincial EE streams like AAIP and OINP",
        where: "ircc.canada.ca",
        cost: "Free",
        time: "1-2 days",
        priority: "urgent"
      },
      {
        step: 2,
        action: "Submit an Expression of Interest (EOI) to the Ontario OINP Masters Graduate stream — the portal opens periodically and fills quickly",
        where: "oinp.gov.on.ca",
        cost: "$1,500 - $2,000",
        time: "Watch for next intake window",
        priority: "urgent"
      },
      {
        step: 3,
        action: "Register an Expression of Interest in the Alberta AAIP Express Entry stream as a parallel strategy",
        where: "alberta.ca/aaip",
        cost: "$500",
        time: "1-2 weeks",
        priority: "high"
      },
      {
        step: 4,
        action: "Verify your ECA (Educational Credential Assessment) is still valid and from a designated organization (WES, ICAS, etc.) — ECA reports expire after 5 years",
        where: "wes.org",
        cost: "$220-300 if renewal needed",
        time: "4-6 weeks if renewal needed",
        priority: "high"
      },
      {
        step: 5,
        action: "Check your PGWP (Post-Graduation Work Permit) expiry date — ensure you have at least 6 months of validity remaining when submitting provincial applications",
        where: "ircc.canada.ca",
        cost: "Free",
        time: "Same day",
        priority: "medium"
      },
      {
        step: 6,
        action: "Consider taking the TEF Canada French test — achieving NCLC 7 in all abilities would add 25-50 bonus CRS points and make you eligible for French-language category draws (cutoff 379-446)",
        where: "lefrancaisdesaffaires.fr/en/tests-diplomas/tef-canada",
        cost: "$350-400",
        time: "3-4 months preparation + test",
        priority: "medium"
      }
    ],
    costs: {
      total: "$3,800 - $5,500",
      items: [
        { name: "Express Entry PR application (principal)", amount: 1365 },
        { name: "Express Entry PR application (spouse)", amount: 1365 },
        { name: "Express Entry PR application (child)", amount: 230 },
        { name: "Ontario OINP application fee", amount: 1500 },
        { name: "Alberta AAIP EE stream fee", amount: 500 },
        { name: "Biometrics (3 persons)", amount: 255 },
        { name: "Medical exams (3 persons)", amount: 900 },
        { name: "Police certificates (2 countries)", amount: 150 }
      ]
    },
    timeline: [
      {
        month: "Month 1-2",
        label: "Foundation",
        tasks: "Create Express Entry profile, submit Ontario OINP EOI, register Alberta AAIP interest, verify ECA validity and PGWP expiry"
      },
      {
        month: "Month 3-4",
        label: "Provincial Applications",
        tasks: "Complete OINP application if invited, finalize Alberta AAIP EOI, gather supporting documents (employment letters, bank statements, police certificates)"
      },
      {
        month: "Month 5-8",
        label: "Nomination Processing",
        tasks: "Wait for provincial nomination decision (~3-6 months for OINP, ~1 month for Alberta Tech Pathway). If nominated, CRS jumps to ~1,087 and ITA is virtually certain in next draw"
      },
      {
        month: "Month 9-10",
        label: "ITA and PR Application",
        tasks: "Receive ITA (Invitation to Apply) from Express Entry draw, submit complete PR application within 60 days, complete medical exams and biometrics"
      },
      {
        month: "Month 11-18",
        label: "PR Processing",
        tasks: "IRCC processes PR application (~6-8 months current processing time). Receive COPR (Confirmation of Permanent Residence) and complete landing"
      }
    ]
  }),
};

export default DEV_CONFIG;
