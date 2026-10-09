import React, { useState, useEffect, useCallback } from "react";

const GOOGLE_FONTS_ID = "assessmentflow-google-fonts";

const COLORS = {
  bg: "#090909",
  card: "#121212",
  border: "rgba(238,237,232,0.16)",
  primary: "#b74550",
  accent: "#df969b",
  text: "#eeede8",
  muted: "#aaa7a1",
  soft: "#29191b",
  danger: "#ee9696",
};

const EDUCATION_OPTIONS = [
  "PhD",
  "Master's",
  "Two or more credentials (one 3+ yr)",
  "Bachelor's (3+ yr)",
  "2-year post-secondary",
  "1-year post-secondary",
  "High school diploma",
  "Less than high school",
];

const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "Common-law",
  "Divorced",
  "Separated",
  "Widowed",
];

const ENGLISH_TESTS = [
  "IELTS General Training",
  "CELPIP General",
  "PTE Core",
  "No test yet",
];

const SPOUSE_TESTS = ["IELTS", "CELPIP", "PTE Core", "No test"];
const FRENCH_TESTS = ["TEF Canada", "TCF Canada"];
const WORK_FOREIGN_OPTIONS = ["None", "1 year", "2 years", "3 years", "4-5 years", "6+ years"];
const WORK_CANADIAN_OPTIONS = ["None", "1 year", "2 years", "3 years", "4 years", "5+ years"];
const WORK_CANADIAN_SPOUSE_OPTIONS = ["None", "1 year", "2 years", "3+ years"];
const TEER_OPTIONS = ["TEER 0", "TEER 1", "TEER 2", "TEER 3", "TEER 4 or 5", "Not sure"];
const YES_NO = ["Yes", "No"];

const PROVINCES = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Northwest Territories",
  "Nova Scotia",
  "Nunavut",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Yukon",
];

const PROVINCE_PREFERENCE = [...PROVINCES];

const COUNTRIES = [
  "Afghanistan",
  "Algeria",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bangladesh",
  "Belarus",
  "Belgium",
  "Brazil",
  "Cameroon",
  "Canada",
  "Chile",
  "China",
  "Colombia",
  "Czech Republic",
  "Egypt",
  "France",
  "Georgia",
  "Germany",
  "Ghana",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kyrgyzstan",
  "Malaysia",
  "Mexico",
  "Moldova",
  "Morocco",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Pakistan",
  "Philippines",
  "Poland",
  "Portugal",
  "Romania",
  "Russia",
  "Saudi Arabia",
  "South Africa",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Sweden",
  "Switzerland",
  "Turkey",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uzbekistan",
  "Vietnam",
  "Other",
];

const INITIAL_PROFILE = {
  age: "",
  maritalStatus: "",
  spouseAccompanying: "",
  spouseIsCitizenPR: "",
  dependentChildren: "",
  citizenship: "",
  education: "",
  educationCountry: "",
  ecaObtained: "",
  canadianEducationYears: "",
  firstLangTest: "",
  reading: "",
  writing: "",
  listening: "",
  speaking: "",
  hasSecondLang: "",
  secondLangTest: "",
  frReading: "",
  frWriting: "",
  frListening: "",
  frSpeaking: "",
  spouseLangTest: "",
  spouseReading: "",
  spouseWriting: "",
  spouseListening: "",
  spouseSpeaking: "",
  spouseEducation: "",
  spouseCanadianWorkYears: "",
  foreignWorkYears: "",
  canadianWorkYears: "",
  nocTeer: "",
  inCanada: "",
  currentProvince: "",
  siblingInCanada: "",
  provincialNomination: "",
  provincePreference: "",
  hasJobOffer: "",
  settlementFunds: "",
  previousRefusals: "",
  criminalHistory: "",
  openToStudy: "",
};

function injectFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById(GOOGLE_FONTS_ID)) return;

  const preconnect1 = document.createElement("link");
  preconnect1.rel = "preconnect";
  preconnect1.href = "https://fonts.googleapis.com";
  preconnect1.id = `${GOOGLE_FONTS_ID}-pre1`;
  document.head.appendChild(preconnect1);

  const preconnect2 = document.createElement("link");
  preconnect2.rel = "preconnect";
  preconnect2.href = "https://fonts.gstatic.com";
  preconnect2.crossOrigin = "";
  preconnect2.id = `${GOOGLE_FONTS_ID}-pre2`;
  document.head.appendChild(preconnect2);

  const link = document.createElement("link");
  link.id = GOOGLE_FONTS_ID;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

function ToggleGroup({ value, onChange, options = YES_NO }) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            style={{
              padding: "14px 18px",
              borderRadius: 14,
              border: `1px solid ${active ? COLORS.primary : COLORS.border}`,
              background: active ? COLORS.soft : COLORS.card,
              color: COLORS.text,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 180ms ease",
              minWidth: 110,
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function SelectField({ value, onChange, options, placeholder = "Select an option" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={styles.select}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SearchableDropdown({ value, onChange, options, placeholder = "Search country" }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes((query || "").toLowerCase())
  );

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        placeholder={placeholder}
        style={styles.input}
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: "0 18px 40px rgba(27, 67, 50, 0.08)",
            zIndex: 30,
          }}
        >
          {filtered.map((option) => (
            <button
              key={option}
              type="button"
              onMouseDown={() => {
                onChange(option);
                setQuery(option);
                setOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: "13px 14px",
                fontFamily: "Manrope, sans-serif",
                fontSize: 15,
                color: COLORS.text,
                cursor: "pointer",
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreInputs({ values, onChange, step = "0.5", subtitle }) {
  const labels = [
    { key: "reading", label: "Reading" },
    { key: "writing", label: "Writing" },
    { key: "listening", label: "Listening" },
    { key: "speaking", label: "Speaking" },
  ];

  return (
    <div>
      {subtitle ? <p style={styles.subtleText}>{subtitle}</p> : null}
      <div style={styles.grid4}>
        {labels.map((item) => (
          <div key={item.key}>
            <label style={styles.smallLabel}>{item.label}</label>
            <input
              type="number"
              inputMode="decimal"
              step={step}
              min="0"
              value={values[item.key]}
              onChange={(e) => onChange(item.key, e.target.value)}
              style={styles.input}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SpouseScoreInputs({ values, onChange, step = "0.5" }) {
  const labels = [
    { key: "spouseReading", label: "Reading" },
    { key: "spouseWriting", label: "Writing" },
    { key: "spouseListening", label: "Listening" },
    { key: "spouseSpeaking", label: "Speaking" },
  ];

  return (
    <div style={styles.grid4}>
      {labels.map((item) => (
        <div key={item.key}>
          <label style={styles.smallLabel}>{item.label}</label>
          <input
            type="number"
            inputMode="decimal"
            step={step}
            min="0"
            value={values[item.key]}
            onChange={(e) => onChange(item.key, e.target.value)}
            style={styles.input}
          />
        </div>
      ))}
    </div>
  );
}

function FrenchScoreInputs({ values, onChange }) {
  const labels = [
    { key: "frReading", label: "Reading" },
    { key: "frWriting", label: "Writing" },
    { key: "frListening", label: "Listening" },
    { key: "frSpeaking", label: "Speaking" },
  ];

  return (
    <div style={styles.grid4}>
      {labels.map((item) => (
        <div key={item.key}>
          <label style={styles.smallLabel}>{item.label}</label>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={values[item.key]}
            onChange={(e) => onChange(item.key, e.target.value)}
            style={styles.input}
          />
        </div>
      ))}
    </div>
  );
}

function ReviewRow({ label, value, onEdit }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(110px, 160px) 1fr auto",
        gap: 12,
        padding: "12px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        alignItems: "start",
      }}
    >
      <div style={{ color: COLORS.muted, fontSize: 14 }}>{label}</div>
      <div style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>{value || "—"}</div>
      <button type="button" onClick={onEdit} style={styles.editLink}>
        Edit
      </button>
    </div>
  );
}

export default function AssessmentFlow({ onComplete, onBack }) {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [stepIndex, setStepIndex] = useState(0);
  const [displayedStepIndex, setDisplayedStepIndex] = useState(0);
  const [phase, setPhase] = useState("in");
  const [queuedStepIndex, setQueuedStepIndex] = useState(null);
  const [error, setError] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    injectFonts();
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const updateProfile = useCallback((key, value) => {
    setProfile((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "maritalStatus" && value !== "Married" && value !== "Common-law") {
        next.spouseAccompanying = "";
        next.spouseIsCitizenPR = "";
        next.spouseEducation = "";
        next.spouseLangTest = "";
        next.spouseReading = "";
        next.spouseWriting = "";
        next.spouseListening = "";
        next.spouseSpeaking = "";
        next.spouseCanadianWorkYears = "";
      }

      if (key === "spouseAccompanying" && value !== "Yes") {
        next.spouseIsCitizenPR = "";
        next.spouseEducation = "";
        next.spouseLangTest = "";
        next.spouseReading = "";
        next.spouseWriting = "";
        next.spouseListening = "";
        next.spouseSpeaking = "";
        next.spouseCanadianWorkYears = "";
      }

      if (key === "spouseIsCitizenPR" && value === "Yes") {
        next.spouseLangTest = "";
        next.spouseReading = "";
        next.spouseWriting = "";
        next.spouseListening = "";
        next.spouseSpeaking = "";
      }

      if (key === "educationCountry") {
        next.ecaObtained = value === "Outside Canada" ? next.ecaObtained : "";
        next.canadianEducationYears = "";
      }

      if (key === "firstLangTest" && value === "No test yet") {
        next.reading = "";
        next.writing = "";
        next.listening = "";
        next.speaking = "";
      }

      if (key === "hasSecondLang" && value !== "Yes") {
        next.secondLangTest = "";
        next.frReading = "";
        next.frWriting = "";
        next.frListening = "";
        next.frSpeaking = "";
      }

      if (key === "secondLangTest" && !value) {
        next.frReading = "";
        next.frWriting = "";
        next.frListening = "";
        next.frSpeaking = "";
      }

      if (key === "spouseLangTest" && (value === "No test" || !value)) {
        next.spouseReading = "";
        next.spouseWriting = "";
        next.spouseListening = "";
        next.spouseSpeaking = "";
      }

      if (key === "inCanada" && value !== "Yes") {
        next.currentProvince = "";
      }

      return next;
    });
  }, []);

  const getEnglishStepValue = () => {
    if (profile.firstLangTest === "IELTS General Training") return "0.5";
    if (profile.firstLangTest === "CELPIP General") return "1";
    if (profile.firstLangTest === "PTE Core") return "1";
    return "0.5";
  };

  const getSpouseStepValue = () => {
    if (profile.spouseLangTest === "IELTS") return "0.5";
    return "1";
  };

  const screens = [
    {
      id: "age",
      label: "Age",
      title: "How old are you?",
      render: () => (
        <input
          autoFocus
          type="number"
          min="17"
          max="65"
          inputMode="numeric"
          value={profile.age}
          onChange={(e) => updateProfile("age", e.target.value)}
          style={styles.input}
          placeholder="Enter age"
        />
      ),
      isValid: () => Number(profile.age) >= 17 && Number(profile.age) <= 65,
    },
    {
      id: "maritalStatus",
      label: "Marital status",
      title: "What is your marital status?",
      render: () => (
        <SelectField
          value={profile.maritalStatus}
          onChange={(value) => updateProfile("maritalStatus", value)}
          options={MARITAL_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.maritalStatus),
    },
    {
      id: "spouseAccompanying",
      label: "Spouse accompanying",
      condition: () => ["Married", "Common-law"].includes(profile.maritalStatus),
      title: "Will your spouse/partner accompany you to Canada?",
      render: () => (
        <ToggleGroup
          value={profile.spouseAccompanying}
          onChange={(value) => updateProfile("spouseAccompanying", value)}
        />
      ),
      isValid: () => Boolean(profile.spouseAccompanying),
    },
    {
      id: "spouseIsCitizenPR",
      label: "Spouse citizen/PR",
      condition: () => profile.spouseAccompanying === "Yes",
      title: "Is your spouse a Canadian citizen or permanent resident?",
      render: () => (
        <ToggleGroup
          value={profile.spouseIsCitizenPR}
          onChange={(value) => updateProfile("spouseIsCitizenPR", value)}
        />
      ),
      isValid: () => Boolean(profile.spouseIsCitizenPR),
    },
    {
      id: "dependentChildren",
      label: "Dependent children",
      title: "How many dependent children do you have?",
      render: () => (
        <input
          autoFocus
          type="number"
          min="0"
          max="6"
          inputMode="numeric"
          value={profile.dependentChildren}
          onChange={(e) => updateProfile("dependentChildren", e.target.value)}
          style={styles.input}
          placeholder="0"
        />
      ),
      isValid: () => profile.dependentChildren !== "" && Number(profile.dependentChildren) >= 0,
    },
    {
      id: "citizenship",
      label: "Citizenship",
      title: "What is your country of citizenship?",
      render: () => (
        <SearchableDropdown
          value={profile.citizenship}
          onChange={(value) => updateProfile("citizenship", value)}
          options={COUNTRIES}
        />
      ),
      isValid: () => Boolean(profile.citizenship),
    },
    {
      id: "education",
      label: "Education",
      title: "What is your highest level of education?",
      render: () => (
        <SelectField
          value={profile.education}
          onChange={(value) => updateProfile("education", value)}
          options={EDUCATION_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.education),
    },
    {
      id: "educationCountry",
      label: "Study location",
      title: "Where did you study?",
      render: () => (
        <SelectField
          value={profile.educationCountry}
          onChange={(value) => updateProfile("educationCountry", value)}
          options={["In Canada", "Outside Canada"]}
        />
      ),
      isValid: () => Boolean(profile.educationCountry),
    },
    {
      id: "canadianEducationYears",
      label: "Years studied in Canada",
      condition: () => profile.educationCountry === "In Canada",
      title: "How many years did you study in Canada?",
      subtitle: "1 year = some CRS bonus, 2+ years = higher bonus, 3+ years = maximum education bonus",
      render: () => (
        <SelectField
          value={profile.canadianEducationYears}
          onChange={(value) => updateProfile("canadianEducationYears", value)}
          options={["1 year or less", "2 years", "3+ years (degree program)"]}
        />
      ),
      isValid: () => Boolean(profile.canadianEducationYears),
    },
    {
      id: "ecaObtained",
      label: "ECA",
      condition: () => profile.educationCountry === "Outside Canada",
      title: "Have you obtained an Educational Credential Assessment (ECA)?",
      subtitle: "ECA is required for foreign credentials in Express Entry",
      render: () => (
        <ToggleGroup
          value={profile.ecaObtained}
          onChange={(value) => updateProfile("ecaObtained", value)}
        />
      ),
      isValid: () => Boolean(profile.ecaObtained),
    },
    {
      id: "spouseEducation",
      label: "Spouse education",
      condition: () => profile.spouseAccompanying === "Yes",
      title: "What is your spouse's highest education?",
      render: () => (
        <SelectField
          value={profile.spouseEducation}
          onChange={(value) => updateProfile("spouseEducation", value)}
          options={EDUCATION_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.spouseEducation),
    },
    {
      id: "firstLangTest",
      label: "English test",
      title: "What English language test did you take?",
      render: () => (
        <SelectField
          value={profile.firstLangTest}
          onChange={(value) => updateProfile("firstLangTest", value)}
          options={ENGLISH_TESTS}
        />
      ),
      isValid: () => Boolean(profile.firstLangTest),
    },
    {
      id: "englishScores",
      label: "English scores",
      condition: () => profile.firstLangTest && profile.firstLangTest !== "No test yet",
      title: "Enter your test scores",
      subtitle: "",
      render: () => (
        <ScoreInputs
          values={profile}
          onChange={updateProfile}
          step={getEnglishStepValue()}
          subtitle={
            profile.firstLangTest === "IELTS General Training"
              ? "IELTS accepted range: 0.0 to 9.0, typically in 0.5 increments"
              : profile.firstLangTest === "CELPIP General"
              ? "CELPIP accepted range: 1 to 12"
              : "PTE Core accepted range varies by module; enter your official scores"
          }
        />
      ),
      isValid: () =>
        [profile.reading, profile.writing, profile.listening, profile.speaking].every((v) => v !== ""),
    },
    {
      id: "hasSecondLang",
      label: "French test",
      title: "Do you have French language test scores?",
      subtitle: "French proficiency can add 25-50 bonus CRS points",
      render: () => (
        <ToggleGroup
          value={profile.hasSecondLang}
          onChange={(value) => updateProfile("hasSecondLang", value)}
        />
      ),
      isValid: () => Boolean(profile.hasSecondLang),
    },
    {
      id: "secondLangTest",
      label: "French test type",
      condition: () => profile.hasSecondLang === "Yes",
      title: "Which French test?",
      render: () => (
        <SelectField
          value={profile.secondLangTest}
          onChange={(value) => updateProfile("secondLangTest", value)}
          options={FRENCH_TESTS}
        />
      ),
      isValid: () => Boolean(profile.secondLangTest),
    },
    {
      id: "frenchScores",
      label: "French scores",
      condition: () => Boolean(profile.secondLangTest),
      title: "Enter your French test scores",
      render: () => <FrenchScoreInputs values={profile} onChange={updateProfile} />,
      isValid: () =>
        [profile.frReading, profile.frWriting, profile.frListening, profile.frSpeaking].every(
          (v) => v !== ""
        ),
    },
    {
      id: "spouseLangTest",
      label: "Spouse test",
      condition: () => profile.spouseAccompanying === "Yes" && profile.spouseIsCitizenPR !== "Yes",
      title: "What is your spouse's language test?",
      render: () => (
        <SelectField
          value={profile.spouseLangTest}
          onChange={(value) => updateProfile("spouseLangTest", value)}
          options={SPOUSE_TESTS}
        />
      ),
      isValid: () => Boolean(profile.spouseLangTest),
    },
    {
      id: "spouseScores",
      label: "Spouse scores",
      condition: () => profile.spouseLangTest && profile.spouseLangTest !== "No test",
      title: "Spouse's test scores",
      render: () => <SpouseScoreInputs values={profile} onChange={updateProfile} step={getSpouseStepValue()} />,
      isValid: () =>
        [
          profile.spouseReading,
          profile.spouseWriting,
          profile.spouseListening,
          profile.spouseSpeaking,
        ].every((v) => v !== ""),
    },
    {
      id: "foreignWorkYears",
      label: "Foreign work",
      title: "How many years of foreign skilled work experience?",
      render: () => (
        <SelectField
          value={profile.foreignWorkYears}
          onChange={(value) => updateProfile("foreignWorkYears", value)}
          options={WORK_FOREIGN_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.foreignWorkYears),
    },
    {
      id: "canadianWorkYears",
      label: "Canadian work",
      title: "How many years of Canadian skilled work experience?",
      render: () => (
        <SelectField
          value={profile.canadianWorkYears}
          onChange={(value) => updateProfile("canadianWorkYears", value)}
          options={WORK_CANADIAN_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.canadianWorkYears),
    },
    {
      id: "spouseCanadianWorkYears",
      label: "Spouse Canadian work",
      condition: () => profile.spouseAccompanying === "Yes",
      title: "How many years of Canadian work experience does your spouse have?",
      render: () => (
        <SelectField
          value={profile.spouseCanadianWorkYears}
          onChange={(value) => updateProfile("spouseCanadianWorkYears", value)}
          options={WORK_CANADIAN_SPOUSE_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.spouseCanadianWorkYears),
    },
    {
      id: "nocTeer",
      label: "NOC TEER",
      title: "What is your NOC TEER level?",
      subtitle:
        "TEER 0 = Senior managers, legislators. TEER 1 = Professionals (engineers, doctors, accountants). TEER 2 = Technical/skilled trades (electricians, plumbers). TEER 3 = Intermediate (bakers, dental assistants). TEER 4/5 = Labour/elementary occupations (not eligible for Federal Skilled Worker, but may qualify for other programs). Choose 'Not sure' if you don't know your level.",
      render: () => (
        <SelectField
          value={profile.nocTeer}
          onChange={(value) => updateProfile("nocTeer", value)}
          options={TEER_OPTIONS}
        />
      ),
      isValid: () => Boolean(profile.nocTeer),
    },
    {
      id: "inCanada",
      label: "Currently in Canada",
      title: "Are you currently in Canada?",
      render: () => (
        <ToggleGroup value={profile.inCanada} onChange={(value) => updateProfile("inCanada", value)} />
      ),
      isValid: () => Boolean(profile.inCanada),
    },
    {
      id: "currentProvince",
      label: "Current province",
      condition: () => profile.inCanada === "Yes",
      title: "Which province?",
      render: () => (
        <SelectField
          value={profile.currentProvince}
          onChange={(value) => updateProfile("currentProvince", value)}
          options={PROVINCES}
        />
      ),
      isValid: () => Boolean(profile.currentProvince),
    },
    {
      id: "siblingInCanada",
      label: "Sibling in Canada",
      title: "Do you have a sibling who is a Canadian citizen or PR?",
      render: () => (
        <ToggleGroup
          value={profile.siblingInCanada}
          onChange={(value) => updateProfile("siblingInCanada", value)}
        />
      ),
      isValid: () => Boolean(profile.siblingInCanada),
    },
    {
      id: "provincialNomination",
      label: "Provincial nomination",
      title: "Do you have a provincial nomination?",
      render: () => (
        <ToggleGroup
          value={profile.provincialNomination}
          onChange={(value) => updateProfile("provincialNomination", value)}
        />
      ),
      isValid: () => Boolean(profile.provincialNomination),
    },
    {
      id: "provincePreference",
      label: "Province preference",
      title: "Do you have a preference for a specific province?",
      render: () => (
        <SelectField
          value={profile.provincePreference}
          onChange={(value) => updateProfile("provincePreference", value)}
          options={PROVINCE_PREFERENCE}
          placeholder="Open to any"
        />
      ),
      isValid: () => true,
    },
    {
      id: "hasJobOffer",
      label: "Job offer",
      title: "Do you currently have a valid job offer in Canada?",
      render: () => (
        <ToggleGroup
          value={profile.hasJobOffer}
          onChange={(value) => updateProfile("hasJobOffer", value)}
        />
      ),
      isValid: () => Boolean(profile.hasJobOffer),
    },
    {
      id: "settlementFunds",
      label: "Settlement funds",
      title: "How much do you have in settlement funds (CAD)?",
      subtitle:
        "Required funds depend on family size. As a rough guide: 1 person ≈ $14k+, 2 people ≈ $17k+, 3 people ≈ $21k+, 4 people ≈ $25k+.",
      render: () => (
        <input
          autoFocus
          type="number"
          min="0"
          inputMode="decimal"
          value={profile.settlementFunds}
          onChange={(e) => updateProfile("settlementFunds", e.target.value)}
          style={styles.input}
          placeholder="e.g. 20000"
        />
      ),
      isValid: () => profile.settlementFunds !== "",
    },
    {
      id: "previousRefusals",
      label: "Visa refusals",
      title: "Have you had any previous visa refusals?",
      render: () => (
        <ToggleGroup
          value={profile.previousRefusals}
          onChange={(value) => updateProfile("previousRefusals", value)}
        />
      ),
      isValid: () => Boolean(profile.previousRefusals),
    },
    {
      id: "criminalHistory",
      label: "Criminal history",
      title: "Do you have any criminal history?",
      render: () => (
        <ToggleGroup
          value={profile.criminalHistory}
          onChange={(value) => updateProfile("criminalHistory", value)}
        />
      ),
      isValid: () => Boolean(profile.criminalHistory),
    },
    {
      id: "openToStudy",
      label: "Open to study",
      title: "Are you open to studying in Canada as a pathway to PR?",
      subtitle: "Study Permit → PGWP → PR pathway",
      render: () => (
        <ToggleGroup
          value={profile.openToStudy}
          onChange={(value) => updateProfile("openToStudy", value)}
        />
      ),
      isValid: () => Boolean(profile.openToStudy),
    },
    {
      id: "summary",
      label: "Summary",
      title: "Review your answers",
      render: () => (
        <div>
          <p style={{ ...styles.subtleText, marginBottom: 18 }}>
            Double-check your profile before generating the full pathway report.
          </p>
          <div>
            <ReviewRow label="Age" value={profile.age} onEdit={() => jumpTo("age")} />
            <ReviewRow label="Marital" value={profile.maritalStatus} onEdit={() => jumpTo("maritalStatus")} />
            <ReviewRow
              label="Spouse"
              value={profile.spouseAccompanying || "Not applicable"}
              onEdit={() => jumpTo("spouseAccompanying")}
            />
            <ReviewRow label="Children" value={profile.dependentChildren} onEdit={() => jumpTo("dependentChildren")} />
            <ReviewRow label="Citizenship" value={profile.citizenship} onEdit={() => jumpTo("citizenship")} />
            <ReviewRow label="Education" value={profile.education} onEdit={() => jumpTo("education")} />
            <ReviewRow
              label="Study location"
              value={profile.educationCountry}
              onEdit={() => jumpTo("educationCountry")}
            />
            <ReviewRow label="English test" value={profile.firstLangTest} onEdit={() => jumpTo("firstLangTest")} />
            <ReviewRow label="French" value={profile.hasSecondLang} onEdit={() => jumpTo("hasSecondLang")} />
            <ReviewRow label="Foreign work" value={profile.foreignWorkYears} onEdit={() => jumpTo("foreignWorkYears")} />
            <ReviewRow
              label="Canadian work"
              value={profile.canadianWorkYears}
              onEdit={() => jumpTo("canadianWorkYears")}
            />
            <ReviewRow label="NOC TEER" value={profile.nocTeer} onEdit={() => jumpTo("nocTeer")} />
            <ReviewRow label="In Canada" value={profile.inCanada} onEdit={() => jumpTo("inCanada")} />
            <ReviewRow
              label="Province pref."
              value={profile.provincePreference || "Open to any"}
              onEdit={() => jumpTo("provincePreference")}
            />
            <ReviewRow label="Job offer" value={profile.hasJobOffer} onEdit={() => jumpTo("hasJobOffer")} />
            <ReviewRow
              label="Settlement funds"
              value={profile.settlementFunds ? `$${profile.settlementFunds}` : ""}
              onEdit={() => jumpTo("settlementFunds")}
            />
            <ReviewRow
              label="Refusals"
              value={profile.previousRefusals}
              onEdit={() => jumpTo("previousRefusals")}
            />
            <ReviewRow
              label="Criminal history"
              value={profile.criminalHistory}
              onEdit={() => jumpTo("criminalHistory")}
            />
            <ReviewRow label="Study pathway" value={profile.openToStudy} onEdit={() => jumpTo("openToStudy")} />
          </div>
        </div>
      ),
      isValid: () => true,
    },
  ];

  const visibleScreens = screens.filter((screen) => (screen.condition ? screen.condition() : true));

  useEffect(() => {
    if (stepIndex > visibleScreens.length - 1) {
      setStepIndex(Math.max(visibleScreens.length - 1, 0));
      setDisplayedStepIndex(Math.max(visibleScreens.length - 1, 0));
    }
  }, [stepIndex, visibleScreens.length]);

  const currentScreen = visibleScreens[displayedStepIndex] || visibleScreens[0];
  const realCurrentScreen = visibleScreens[stepIndex] || visibleScreens[0];
  const isLast = stepIndex === visibleScreens.length - 1;
  const progress = visibleScreens.length > 1 ? (stepIndex / (visibleScreens.length - 1)) * 100 : 0;

  const validateCurrent = useCallback(() => {
    if (!realCurrentScreen || realCurrentScreen.id === "summary") return true;
    if (realCurrentScreen.isValid()) {
      setError("");
      return true;
    }
    setError("Please complete this step before continuing.");
    return false;
  }, [realCurrentScreen]);

  const transitionTo = useCallback(
    (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= visibleScreens.length || nextIndex === stepIndex) return;
      setError("");
      setQueuedStepIndex(nextIndex);
      setPhase("out");
    },
    [stepIndex, visibleScreens.length]
  );

  useEffect(() => {
    if (phase !== "out" || queuedStepIndex === null) return;
    const t = window.setTimeout(() => {
      setDisplayedStepIndex(queuedStepIndex);
      setStepIndex(queuedStepIndex);
      setPhase("in");
      setQueuedStepIndex(null);
    }, 220);
    return () => window.clearTimeout(t);
  }, [phase, queuedStepIndex]);

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete?.(profile);
      return;
    }
    if (!validateCurrent()) return;
    transitionTo(stepIndex + 1);
  }, [isLast, onComplete, profile, stepIndex, transitionTo, validateCurrent]);

  const handleBackStep = useCallback(() => {
    if (stepIndex === 0) {
      onBack?.();
      return;
    }
    transitionTo(stepIndex - 1);
  }, [onBack, stepIndex, transitionTo]);

  const jumpTo = useCallback(
    (id) => {
      const targetIndex = visibleScreens.findIndex((screen) => screen.id === id);
      if (targetIndex >= 0) transitionTo(targetIndex);
    },
    [transitionTo, visibleScreens]
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Enter") return;
      const tag = document.activeElement?.tagName;
      if (tag === "TEXTAREA") return;
      e.preventDefault();
      handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext]);

  const cardTransform =
    phase === "out" ? "translateY(12px) scale(0.985)" : "translateY(0px) scale(1)";
  const cardOpacity = phase === "out" ? 0 : 1;

  return (
    <div style={styles.page}>
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressFill,
            width: `${Math.max(progress, 4)}%`,
          }}
        />
      </div>

      <div style={styles.header}>
        <button type="button" onClick={handleBackStep} style={styles.backButton}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span>{stepIndex === 0 ? "Back" : "Back"}</span>
        </button>

        <div style={styles.logoWrap}>
          <div style={styles.logoMark} />
          <span style={styles.logoText}>PathwayFinder <span style={{ color: COLORS.muted, fontWeight: 400 }}> / Canada</span></span>
        </div>
      </div>

      <div style={styles.centerWrap}>
        <div
          style={{
            ...styles.card,
            width: isMobile ? "100%" : 720,
            opacity: cardOpacity,
            transform: cardTransform,
            transition:
              "opacity 320ms ease, transform 360ms ease, box-shadow 240ms ease",
          }}
        >
          <div style={styles.stepMeta}>
            <span>
              {Math.min(stepIndex + 1, visibleScreens.length)} / {visibleScreens.length}
            </span>
            <span>{currentScreen.label}</span>
          </div>

          <h1 style={styles.title}>{currentScreen.title}</h1>
          {currentScreen.subtitle ? <p style={styles.subtitle}>{currentScreen.subtitle}</p> : null}

          <div style={{ marginTop: 24 }}>{currentScreen.render()}</div>

          {error ? <p style={styles.error}>{error}</p> : <div style={{ height: 26 }} />}

          <div style={styles.footerRow}>
            <div style={styles.enterHint}>Press Enter to continue</div>
            <button type="button" onClick={handleNext} style={styles.ctaButton}>
              {isLast ? "Generate My Report →" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    fontFamily: "Manrope, sans-serif",
    color: COLORS.text,
    padding: "0 20px 28px",
  },
  progressTrack: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "rgba(238,237,232,0.08)",
    zIndex: 50,
  },
  progressFill: {
    height: "100%",
    background: COLORS.accent,
    transition: "width 360ms ease",
    borderRadius: 999,
  },
  header: {
    maxWidth: 1100,
    margin: "0 auto",
    paddingTop: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backButton: {
    border: "none",
    background: "transparent",
    color: COLORS.text,
    fontFamily: "Manrope, sans-serif",
    fontSize: 15,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    padding: 0,
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },
  logoMark: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.accent})`,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: COLORS.text,
  },
  centerWrap: {
    minHeight: "calc(100vh - 80px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 1100,
    margin: "0 auto",
    padding: "24px 0 10px",
  },
  card: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.2)",
    padding: "28px clamp(20px, 4vw, 40px)",
  },
  stepMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontFamily: "'Instrument Serif', Georgia, serif",
    fontSize: "clamp(34px, 5vw, 50px)",
    lineHeight: 1.02,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 0,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 620,
  },
  subtleText: {
    marginTop: 0,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 1.6,
  },
  input: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    padding: "0 16px",
    fontFamily: "Manrope, sans-serif",
    fontSize: 16,
    color: COLORS.text,
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 56,
    borderRadius: 16,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.card,
    padding: "0 16px",
    fontFamily: "Manrope, sans-serif",
    fontSize: 16,
    color: COLORS.text,
    outline: "none",
    boxSizing: "border-box",
    appearance: "none",
  },
  smallLabel: {
    display: "block",
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 8,
    fontWeight: 700,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 14,
  },
  footerRow: {
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  enterHint: {
    fontSize: 13,
    color: COLORS.muted,
  },
  ctaButton: {
    border: "none",
    background: COLORS.primary,
    color: "#fff",
    padding: "14px 20px",
    borderRadius: 14,
    fontFamily: "Manrope, sans-serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
  },
  error: {
    marginTop: 16,
    marginBottom: 0,
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: 600,
  },
  editLink: {
    border: "none",
    background: "transparent",
    color: COLORS.primary,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    padding: 0,
  },
};
