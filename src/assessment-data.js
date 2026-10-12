export const EDUCATION_OPTIONS = [
  "PhD",
  "Master's",
  "Two or more credentials (one 3+ yr)",
  "Bachelor's (3+ yr)",
  "2-year post-secondary",
  "1-year post-secondary",
  "High school diploma",
  "Less than high school",
];

export const MARITAL_OPTIONS = [
  "Single",
  "Married",
  "Common-law",
  "Divorced",
  "Separated",
  "Widowed",
];

export const ENGLISH_TESTS = [
  "IELTS General Training",
  "CELPIP General",
  "PTE Core",
  "No test yet",
];

export const SPOUSE_TESTS = ["IELTS", "CELPIP", "PTE Core", "No test"];
export const FRENCH_TESTS = ["TEF Canada", "TCF Canada"];
export const WORK_FOREIGN_OPTIONS = ["None", "1 year", "2 years", "3 years", "4-5 years", "6+ years"];
export const WORK_CANADIAN_OPTIONS = ["None", "1 year", "2 years", "3 years", "4 years", "5+ years"];
export const WORK_CANADIAN_SPOUSE_OPTIONS = ["None", "1 year", "2 years", "3+ years"];
export const TEER_OPTIONS = ["TEER 0", "TEER 1", "TEER 2", "TEER 3", "TEER 4 or 5", "Not sure"];
export const YES_NO = ["Yes", "No"];

export const PROVINCES = [
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

export const PROVINCE_PREFERENCE = [...PROVINCES];

export const COUNTRIES = [
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

export const INITIAL_PROFILE = {
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
  nominationType: "",
  provincePreference: "",
  hasJobOffer: "",
  workAuthorizedInCanada: "",
  settlementFunds: "",
  previousRefusals: "",
  criminalHistory: "",
  openToStudy: "",
};


export function updateAssessmentProfile(prev, key, value) {
  const next = { ...prev, [key]: value };

  if (key === "provincialNomination" && value !== "Yes") next.nominationType = "";
  if (key === "hasJobOffer" && value !== "Yes") next.workAuthorizedInCanada = "";

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
}
