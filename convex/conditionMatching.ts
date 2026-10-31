// Matching of a patient's condition names against a trial's target conditions.
// Pure functions, no database access.

// Abbreviations and alternate names, so e.g. "COPD" matches
// "chronic obstructive pulmonary disease". Each inner list is one condition.
const CONDITION_SYNONYMS: string[][] = [
  ["copd", "chronic obstructive pulmonary disease", "emphysema", "chronic bronchitis"],
  ["type 2 diabetes", "type 2 diabetes mellitus", "diabetes mellitus type 2", "type ii diabetes", "t2d", "t2dm"],
  ["type 1 diabetes", "type 1 diabetes mellitus", "diabetes mellitus type 1", "type i diabetes", "t1d", "t1dm"],
  ["hypertension", "high blood pressure", "essential hypertension", "htn"],
  ["coronary artery disease", "coronary heart disease", "ischemic heart disease", "cad"],
  ["stable angina", "chronic stable angina", "angina pectoris", "exertional angina"],
  ["heart failure", "congestive heart failure", "heart failure with reduced ejection fraction", "hfref", "chf"],
  ["atrial fibrillation", "afib"],
  ["alzheimers disease", "alzheimer disease", "alzheimers"],
  ["mild cognitive impairment", "mci"],
  ["breast cancer", "breast carcinoma", "malignant neoplasm of breast", "breast neoplasm"],
  ["parkinsons disease", "parkinson disease", "parkinsons"],
  ["rheumatoid arthritis", "ra"],
  ["chronic kidney disease", "chronic renal disease", "ckd"],
];

function normalizeCondition(name: string) {
  return name
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Short terms (abbreviations) only match as whole words, so "ra" doesn't hit "bradycardia".
function containsTerm(text: string, term: string) {
  return term.length <= 4
    ? new RegExp(`\\b${term}\\b`).test(text)
    : text.includes(term);
}

function conditionTerms(name: string) {
  const normalized = normalizeCondition(name);
  const terms = new Set([normalized]);
  for (const group of CONDITION_SYNONYMS) {
    if (group.some((term) => containsTerm(normalized, term))) {
      group.forEach((term) => terms.add(term));
    }
  }
  return terms;
}

export function conditionsMatch(patientCondition: string, targetCondition: string) {
  const patientTerms = conditionTerms(patientCondition);
  const targetTerms = conditionTerms(targetCondition);
  for (const a of patientTerms) {
    for (const b of targetTerms) {
      if (a && b && (containsTerm(a, b) || containsTerm(b, a))) return true;
    }
  }
  return false;
}
