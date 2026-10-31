// Demo data for local development. Run with:
//   npx convex run seed:seedDemoData
//   python3 scripts/seed_audio.py         (macOS: adds a spoken recording to every seeded consultation)
//   npx convex run seed:resetDemoData     (removes everything this file created, including audio)
// All people, trials and clinical content below are fictional.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const DAY = 86_400_000;
const SEED_TOKEN_PREFIX = "seed|";
const SEED_NOTE = "demo-seed";
const SEED_NCT_PREFIX = "NCTDEMO";

type Severity = "mild" | "moderate" | "severe";
type MatchStatus = "pending" | "approved" | "declined" | "enrolled";

// One consultation. Transcript lines must start with "Doctor:" or "Patient:" (the audio script relies on it).
interface Visit {
  daysAgo: number;
  title: string;
  transcription: string;
  symptoms: string[];
  vitals: Record<string, string>;
  labResults?: Record<string, string>;
  plan: string;
}

interface Story {
  age: number;
  gender: string; // "" when unknown; reports then say "patient"
  location: string;
  conditions: { name: string; severity: Severity }[];
  medications: string[];
  allergies: string[];
  comorbidities: string[];
  labResults: Record<string, string>;
  icd: string[];
  profile: {
    height: number;
    weight: number;
    smokingStatus: string;
    alcoholConsumption: string;
    exerciseFrequency: string;
    functionalStatus: string;
    familyHistory: string[];
  };
  visits: Visit[]; // oldest first; trial matches attach to the latest visit
}

interface Match {
  trial: string;
  score: number;
  reason: string;
  status: MatchStatus;
  notification: "pending" | "sent" | "viewed";
  consent: MatchStatus;
  doctorNotes?: string;
}

const TRIALS = [
  {
    key: "t2d",
    title: "Once-Weekly Oral GLP-1 Agonist in Adults With Type 2 Diabetes and Hypertension",
    description: "A phase 3 study comparing a once-weekly oral GLP-1 receptor agonist with standard metformin-based therapy for glycemic control and blood pressure reduction.",
    sponsor: "Northbridge Pharma (demo)",
    phase: "Phase 3",
    location: "Boston, MA, USA",
    targetConditions: ["Type 2 Diabetes", "Hypertension"],
    eligibilityCriteria: ["Diagnosed type 2 diabetes", "HbA1c between 7.5% and 10.5%", "On stable metformin dose"],
    exclusionCriteria: ["Type 1 diabetes", "History of pancreatitis", "Pregnancy"],
    ageRange: { min: 40, max: 75 },
  },
  {
    key: "angina",
    title: "Novel Anti-Anginal Agent for Chronic Stable Angina",
    description: "A phase 2 trial of a late sodium current inhibitor to reduce exertional chest pain episodes in patients with chronic stable angina.",
    sponsor: "Cardiolane Research (demo)",
    phase: "Phase 2",
    location: "Boston, MA, USA",
    targetConditions: ["Stable Angina", "Coronary Artery Disease"],
    eligibilityCriteria: ["Exertional angina at least twice weekly", "Stable symptoms for 3 months"],
    exclusionCriteria: ["Recent myocardial infarction", "Severe heart failure"],
    ageRange: { min: 40, max: 80 },
  },
  {
    key: "copd",
    title: "Inhaled Dual Bronchodilator for Moderate-to-Severe COPD",
    description: "A phase 3 study evaluating a once-daily LAMA/LABA inhaler for lung function and exacerbation rate in COPD.",
    sponsor: "Aerowell Therapeutics (demo)",
    phase: "Phase 3",
    location: "Chicago, IL, USA",
    targetConditions: ["COPD"],
    eligibilityCriteria: ["Post-bronchodilator FEV1 30-70% predicted", "Smoking history of 10+ pack-years"],
    exclusionCriteria: ["Asthma diagnosis", "Lung surgery in past 12 months"],
    ageRange: { min: 45, max: 80 },
  },
  {
    key: "breast",
    title: "Adjuvant Endocrine Therapy Combination in HR-Positive Early Breast Cancer",
    description: "A phase 2 trial of an oral CDK4/6 inhibitor added to endocrine therapy after surgery in hormone receptor positive early breast cancer.",
    sponsor: "Meridian Oncology Group (demo)",
    phase: "Phase 2",
    location: "Houston, TX, USA",
    targetConditions: ["Breast Cancer"],
    eligibilityCriteria: ["ER-positive disease", "Stage II-III", "Completed primary surgery"],
    exclusionCriteria: ["Metastatic disease", "Prior CDK4/6 inhibitor"],
    ageRange: { min: 30, max: 70 },
    genderRestriction: "female",
  },
  {
    key: "migraine",
    title: "Preventive CGRP Antibody for Episodic Migraine",
    description: "A phase 3 study of a monthly injectable CGRP antibody to reduce monthly migraine days.",
    sponsor: "Halcyon Neuro (demo)",
    phase: "Phase 3",
    location: "Seattle, WA, USA",
    targetConditions: ["Migraine"],
    eligibilityCriteria: ["4-14 migraine days per month", "Migraine onset before age 50"],
    exclusionCriteria: ["Chronic daily headache", "Cardiovascular disease"],
    ageRange: { min: 18, max: 65 },
  },
  {
    key: "alz",
    title: "Anti-Amyloid Antibody in Early Alzheimer's Disease",
    description: "A phase 3 study of an intravenous anti-amyloid antibody in early symptomatic Alzheimer's disease and mild cognitive impairment.",
    sponsor: "Lumen Neuroscience (demo)",
    phase: "Phase 3",
    location: "Phoenix, AZ, USA",
    targetConditions: ["Alzheimer's Disease", "Mild Cognitive Impairment"],
    eligibilityCriteria: ["MMSE 22-28", "Confirmed amyloid positivity", "Study partner available"],
    exclusionCriteria: ["Anticoagulant therapy", "Significant MRI abnormalities"],
    ageRange: { min: 55, max: 85 },
  },
  {
    key: "parkinson",
    title: "Continuous Subcutaneous Levodopa Infusion in Early Parkinson's Disease",
    description: "A phase 2 study of a wearable levodopa infusion pump to reduce motor fluctuations in early Parkinson's disease.",
    sponsor: "Steadyhand Therapeutics (demo)",
    phase: "Phase 2",
    location: "Seattle, WA, USA",
    targetConditions: ["Parkinson's Disease"],
    eligibilityCriteria: ["Diagnosis within 5 years", "Hoehn and Yahr stage 1-2.5", "Stable dopaminergic therapy"],
    exclusionCriteria: ["Prior deep brain stimulation", "Dementia"],
    ageRange: { min: 40, max: 80 },
  },
  {
    key: "ra",
    title: "Oral JAK1 Inhibitor in Methotrexate-Resistant Rheumatoid Arthritis",
    description: "A phase 3 study of a selective JAK1 inhibitor in adults with active rheumatoid arthritis despite methotrexate.",
    sponsor: "Synovia Bio (demo)",
    phase: "Phase 3",
    location: "Chicago, IL, USA",
    targetConditions: ["Rheumatoid Arthritis"],
    eligibilityCriteria: ["6+ swollen joints", "Inadequate response to methotrexate"],
    exclusionCriteria: ["Active tuberculosis", "History of thrombosis"],
    ageRange: { min: 18, max: 75 },
  },
  {
    key: "hf",
    title: "SGLT2 Inhibitor Plus Finerenone in Heart Failure With Reduced Ejection Fraction",
    description: "A phase 3 trial testing whether adding finerenone to SGLT2 inhibitor therapy reduces hospitalisation in HFrEF.",
    sponsor: "Atrium Cardiovascular (demo)",
    phase: "Phase 3",
    location: "Phoenix, AZ, USA",
    targetConditions: ["Heart Failure"],
    eligibilityCriteria: ["Ejection fraction 40% or lower", "NYHA class II-III"],
    exclusionCriteria: ["eGFR below 25", "Potassium above 5.0"],
    ageRange: { min: 45, max: 85 },
  },
  {
    key: "t1d",
    title: "Hybrid Closed-Loop Insulin Delivery in Young Adults With Type 1 Diabetes",
    description: "A phase 3 study comparing an automated insulin delivery system with multiple daily injections.",
    sponsor: "Glucoloop Devices (demo)",
    phase: "Phase 3",
    location: "Houston, TX, USA",
    targetConditions: ["Type 1 Diabetes"],
    eligibilityCriteria: ["Type 1 diabetes for 1+ year", "Age 18-35", "HbA1c 7-11%"],
    exclusionCriteria: ["Pregnancy", "Severe hypoglycaemia in past 6 months"],
    ageRange: { min: 18, max: 35 },
  },
  {
    key: "ckd",
    title: "Kidney Protection With a Novel Endothelin Antagonist in Diabetic Chronic Kidney Disease",
    description: "A phase 2 study measuring albuminuria reduction in chronic kidney disease caused by type 2 diabetes.",
    sponsor: "Nephros Labs (demo)",
    phase: "Phase 2",
    location: "Boston, MA, USA",
    targetConditions: ["Chronic Kidney Disease"],
    eligibilityCriteria: ["eGFR 25-60", "Urine albumin-creatinine ratio above 300 mg/g"],
    exclusionCriteria: ["Kidney transplant", "Heart failure NYHA IV"],
    ageRange: { min: 30, max: 80 },
  },
] as const;

const PATIENTS: (Story & { name: string; slug: string; matches: Match[] })[] = [
  {
    name: "Maria Sanchez",
    slug: "maria.sanchez",
    age: 54,
    gender: "female",
    location: "Boston, MA, USA",
    conditions: [
      { name: "Type 2 diabetes mellitus", severity: "moderate" },
      { name: "Hypertension", severity: "moderate" },
      { name: "Stable angina", severity: "mild" },
    ],
    medications: ["Metformin 1000 mg twice daily", "Lisinopril 10 mg daily"],
    allergies: ["Penicillin"],
    comorbidities: ["Obesity"],
    labResults: { HbA1c: "8.1%" },
    icd: ["E11.65 - Type 2 diabetes mellitus with hyperglycemia", "I10 - Essential hypertension", "I20.9 - Angina pectoris, unspecified"],
    profile: { height: 163, weight: 82, smokingStatus: "Never smoker", alcoholConsumption: "Occasional", exerciseFrequency: "1-2 times per week", functionalStatus: "Independent", familyHistory: ["Father: myocardial infarction at 55"] },
    visits: [
      {
        daysAgo: 40,
        title: "Diabetes review",
        transcription:
          "Doctor: Good morning Maria. What brings you in today?\nPatient: My sugars have been running high, mostly over two hundred in the mornings.\nDoctor: Are you taking the metformin five hundred milligrams twice a day?\nPatient: Yes, and the lisinopril for my blood pressure. I'm allergic to penicillin.\nDoctor: Any chest pain or shortness of breath?\nPatient: Some chest tightness when I climb stairs. It goes away when I rest.\nDoctor: Your blood pressure is one fifty two over ninety four. I'll order an HbA1c and a lipid panel, and we'll talk about the chest tightness when the results are back.",
        symptoms: ["High morning blood sugar", "Exertional chest tightness"],
        vitals: { bloodPressure: "152/94 mmHg", heartRate: "80 bpm" },
        plan: "Order HbA1c and lipid panel. Continue metformin and lisinopril. Return in 4-6 weeks to review results and chest symptoms.",
      },
      {
        daysAgo: 2,
        title: "Follow-up consultation",
        transcription:
          "Doctor: How have you been since the last visit?\nPatient: My blood sugar has been high again. The clinic said my HbA1c was eight point one.\nDoctor: And the chest tightness?\nPatient: Still there when I climb stairs, but it goes away when I rest. I've also been very thirsty and tired.\nDoctor: Your blood pressure today is one forty eight over ninety two. The pattern sounds like stable angina.\nDoctor: I'll increase your metformin to one thousand milligrams twice a day and order an exercise stress test.\nPatient: Okay. Is there anything else that might help?\nDoctor: There's a diabetes trial nearby that may fit you. I'll check your eligibility.",
        symptoms: ["Exertional chest tightness", "Increased thirst", "Fatigue"],
        vitals: { bloodPressure: "148/92 mmHg", heartRate: "78 bpm" },
        labResults: { HbA1c: "8.1%" },
        plan: "Increase metformin to 1000 mg BID. Order exercise stress test. Optimize antihypertensive therapy and recheck BP in 4 weeks. Diet and exercise counselling.",
      },
    ],
    matches: [
      { trial: "t2d", score: 87, reason: "Type 2 diabetes with HbA1c 8.1% on metformin; hypertension present; age within range.", status: "pending", notification: "sent", consent: "pending", doctorNotes: "Good fit. Discuss with patient at next visit." },
      { trial: "angina", score: 74, reason: "Exertional angina symptoms with cardiac risk factors; awaiting stress test result.", status: "pending", notification: "pending", consent: "pending" },
    ],
  },
  {
    name: "James Okafor",
    slug: "james.okafor",
    age: 62,
    gender: "male",
    location: "Chicago, IL, USA",
    conditions: [
      { name: "Chronic obstructive pulmonary disease", severity: "moderate" },
      { name: "Hypertension", severity: "mild" },
    ],
    medications: ["Tiotropium 18 mcg daily", "Albuterol inhaler as needed", "Amlodipine 5 mg daily"],
    allergies: [],
    comorbidities: ["Former smoker (30 pack-years)"],
    labResults: { FEV1: "58% predicted" },
    icd: ["J44.9 - Chronic obstructive pulmonary disease, unspecified", "I10 - Essential hypertension", "Z87.891 - Personal history of nicotine dependence"],
    profile: { height: 178, weight: 88, smokingStatus: "Former smoker", alcoholConsumption: "Rare", exerciseFrequency: "Light walking", functionalStatus: "Independent with exertional limitation", familyHistory: ["Mother: emphysema"] },
    visits: [
      {
        daysAgo: 30,
        title: "Breathing check",
        transcription:
          "Doctor: James, how is your breathing these days?\nPatient: Worse in the mornings. I cough up phlegm and get winded walking up the hill to the mailbox.\nDoctor: How long since you stopped smoking?\nPatient: Eight years. Before that it was about thirty pack years.\nDoctor: Are you using the albuterol much?\nPatient: Maybe three times a week.\nDoctor: Your oxygen saturation is ninety three percent. I'd like to do spirometry and start you on a daily inhaler.",
        symptoms: ["Morning cough with sputum", "Shortness of breath on exertion"],
        vitals: { oxygenSaturation: "93%", bloodPressure: "136/86 mmHg" },
        plan: "Spirometry. Start tiotropium 18 mcg daily. Continue albuterol as needed. Review in 4 weeks.",
      },
      {
        daysAgo: 5,
        title: "Spirometry results",
        transcription:
          "Doctor: Your spirometry shows FEV1 at fifty eight percent of predicted. That's moderate COPD.\nPatient: Is that bad?\nDoctor: It means the airways are narrowed, but there's a lot we can do. Has the tiotropium helped?\nPatient: A little. I'm using the albuterol less, maybe twice a week now.\nDoctor: Good. I'm referring you to pulmonary rehabilitation, and there's an inhaler trial in Chicago you may qualify for.\nPatient: I'd be interested to hear more.",
        symptoms: ["Shortness of breath on exertion", "Morning cough"],
        vitals: { oxygenSaturation: "94%", bloodPressure: "134/84 mmHg" },
        labResults: { FEV1: "58% predicted" },
        plan: "Continue tiotropium. Refer to pulmonary rehabilitation. Repeat spirometry in 3 months. Vaccination review.",
      },
    ],
    matches: [
      { trial: "copd", score: 91, reason: "Moderate COPD with FEV1 58% predicted and 30 pack-year history.", status: "pending", notification: "pending", consent: "pending" },
    ],
  },
  {
    name: "Priya Nair",
    slug: "priya.nair",
    age: 41,
    gender: "female",
    location: "Houston, TX, USA",
    conditions: [{ name: "Breast cancer, hormone receptor positive, stage II", severity: "moderate" }],
    medications: ["Tamoxifen 20 mg daily"],
    allergies: ["Sulfa drugs"],
    comorbidities: [],
    labResults: { "ER status": "Positive", "HER2 status": "Negative" },
    icd: ["C50.911 - Malignant neoplasm of unspecified site of right female breast", "Z17.0 - Estrogen receptor positive status"],
    profile: { height: 160, weight: 58, smokingStatus: "Never smoker", alcoholConsumption: "None", exerciseFrequency: "3 times per week", functionalStatus: "Fully active", familyHistory: ["Aunt: breast cancer"] },
    visits: [
      {
        daysAgo: 8,
        title: "Oncology follow-up",
        transcription:
          "Doctor: How are you tolerating the tamoxifen?\nPatient: Mostly fine. Hot flashes are the worst part, and my joints feel stiff in the morning.\nDoctor: Your surgery was four months ago and the pathology showed estrogen receptor positive, HER2 negative, stage two disease.\nPatient: Right. I'm allergic to sulfa drugs. Is there anything else I can do to lower the chance it comes back?\nDoctor: There are trials adding a second oral therapy after surgery. I'll check which ones fit you.\nPatient: Thank you. I'd like to know my options.",
        symptoms: ["Hot flashes", "Joint stiffness"],
        vitals: { bloodPressure: "118/76 mmHg", heartRate: "70 bpm" },
        plan: "Continue tamoxifen. Manage vasomotor symptoms. Discuss adjuvant trial options. Bone density scan annually.",
      },
    ],
    matches: [
      { trial: "breast", score: 89, reason: "ER-positive stage II disease after surgery; no prior CDK4/6 inhibitor.", status: "approved", notification: "viewed", consent: "approved", doctorNotes: "Patient is interested. Referral sent to trial site." },
    ],
  },
  {
    name: "Daniel Kim",
    slug: "daniel.kim",
    age: 29,
    gender: "male",
    location: "Seattle, WA, USA",
    conditions: [
      { name: "Migraine without aura", severity: "moderate" },
      { name: "Seasonal allergic rhinitis", severity: "mild" },
    ],
    medications: ["Sumatriptan 50 mg as needed"],
    allergies: ["Shellfish"],
    comorbidities: [],
    labResults: {},
    icd: ["G43.009 - Migraine without aura, not intractable", "J30.2 - Other seasonal allergic rhinitis"],
    profile: { height: 180, weight: 75, smokingStatus: "Never smoker", alcoholConsumption: "Social", exerciseFrequency: "Daily", functionalStatus: "Fully active", familyHistory: ["Mother: migraine"] },
    visits: [
      {
        daysAgo: 11,
        title: "Headache review",
        transcription:
          "Doctor: How many migraine days did you have this month?\nPatient: About nine. They start behind one eye, I get nauseous, and I can't stand bright light.\nDoctor: Does the sumatriptan help?\nPatient: It helps if I take it early. I'm allergic to shellfish, nothing else. Spring allergies are acting up too.\nDoctor: Nine days a month is enough that we should talk about a preventive treatment.\nPatient: I'd rather not take a pill every day if I can avoid it.\nDoctor: That's fair. Let's start a headache diary and look at the options together.",
        symptoms: ["Throbbing headache", "Light sensitivity", "Nausea"],
        vitals: { bloodPressure: "116/72 mmHg", heartRate: "66 bpm" },
        plan: "Start migraine diary. Discuss preventive therapy options including clinical trials. Continue sumatriptan early in attacks.",
      },
    ],
    matches: [
      { trial: "migraine", score: 82, reason: "Nine migraine days per month and no cardiovascular disease.", status: "declined", notification: "viewed", consent: "declined", doctorNotes: "Patient prefers to try lifestyle changes first." },
    ],
  },
  {
    name: "Linda Walker",
    slug: "linda.walker",
    age: 71,
    gender: "female",
    location: "Phoenix, AZ, USA",
    conditions: [
      { name: "Mild cognitive impairment", severity: "moderate" },
      { name: "Hypertension", severity: "mild" },
    ],
    medications: ["Donepezil 5 mg daily", "Losartan 50 mg daily"],
    allergies: ["Latex"],
    comorbidities: ["Osteoarthritis"],
    labResults: { MMSE: "25/30" },
    icd: ["G31.84 - Mild cognitive impairment", "I10 - Essential hypertension", "M19.90 - Osteoarthritis, unspecified site"],
    profile: { height: 158, weight: 64, smokingStatus: "Former smoker", alcoholConsumption: "Rare", exerciseFrequency: "Daily walks", functionalStatus: "Independent, needs reminders", familyHistory: ["Mother: dementia"] },
    visits: [
      {
        daysAgo: 60,
        title: "Memory concerns",
        transcription:
          "Doctor: Linda, your daughter mentioned you've been forgetting appointments.\nPatient: Sometimes. I lose words too. I walked into a room yesterday and forgot why.\nDoctor: How long has this been going on?\nPatient: About a year, maybe a little more.\nDoctor: Are you taking the losartan for your blood pressure?\nPatient: Every morning. My knees hurt from the arthritis, but I manage. I'm allergic to latex.\nDoctor: Let's do a memory test today and some blood work to rule out other causes.",
        symptoms: ["Short-term memory loss", "Word-finding difficulty"],
        vitals: { bloodPressure: "134/82 mmHg", heartRate: "74 bpm" },
        plan: "Cognitive screening, B12, thyroid function. Continue losartan. Review with results.",
      },
      {
        daysAgo: 14,
        title: "Cognitive testing results",
        transcription:
          "Doctor: Your memory score today is twenty five out of thirty, and the blood tests were normal.\nPatient: What does that mean?\nDoctor: It fits mild cognitive impairment. It's not dementia, but we should keep a close eye on it.\nPatient: My mother had dementia. I'm worried.\nDoctor: That's understandable. The donepezil you started may help, and there's a research study for early memory problems in Phoenix.\nPatient: My daughter could come with me if I need a partner for it.",
        symptoms: ["Short-term memory loss", "Difficulty finding words"],
        vitals: { bloodPressure: "130/80 mmHg", heartRate: "72 bpm" },
        labResults: { MMSE: "25/30" },
        plan: "Continue donepezil. Neuropsychological testing. Discuss amyloid imaging and clinical trial options with patient and family.",
      },
    ],
    matches: [
      { trial: "alz", score: 78, reason: "MMSE 25/30 and mild cognitive impairment; study partner available.", status: "pending", notification: "pending", consent: "pending" },
    ],
  },
  {
    name: "Robert Chen",
    slug: "robert.chen",
    age: 58,
    gender: "male",
    location: "Seattle, WA, USA",
    conditions: [{ name: "Parkinson's disease", severity: "mild" }],
    medications: ["Carbidopa-levodopa 25/100 mg three times daily"],
    allergies: [],
    comorbidities: ["Constipation"],
    labResults: {},
    icd: ["G20 - Parkinson's disease"],
    profile: { height: 175, weight: 72, smokingStatus: "Never smoker", alcoholConsumption: "Occasional", exerciseFrequency: "Tai chi twice weekly", functionalStatus: "Independent", familyHistory: [] },
    visits: [
      {
        daysAgo: 6,
        title: "Neurology follow-up",
        transcription:
          "Doctor: Robert, how has the tremor been on the levodopa?\nPatient: Better in the mornings, but it comes back about an hour before the next dose.\nDoctor: That sounds like wearing off. Any problems with balance or falls?\nPatient: No falls. My handwriting is getting smaller though.\nDoctor: Your diagnosis was three years ago and you're still at an early stage, which is good.\nPatient: Is there anything newer than more pills?\nDoctor: There's a trial of a small pump that delivers levodopa continuously. You may be a good candidate.",
        symptoms: ["Resting tremor", "End-of-dose wearing off", "Small handwriting"],
        vitals: { bloodPressure: "126/78 mmHg", heartRate: "68 bpm" },
        plan: "Adjust levodopa timing. Physiotherapy referral. Discuss continuous infusion trial.",
      },
    ],
    matches: [
      { trial: "parkinson", score: 88, reason: "Parkinson's disease diagnosed 3 years ago with end-of-dose wearing off.", status: "pending", notification: "sent", consent: "pending", doctorNotes: "Good candidate for continuous infusion." },
    ],
  },
  {
    name: "Aisha Rahman",
    slug: "aisha.rahman",
    age: 36,
    gender: "female",
    location: "Chicago, IL, USA",
    conditions: [{ name: "Rheumatoid arthritis", severity: "moderate" }],
    medications: ["Methotrexate 15 mg weekly", "Folic acid 1 mg daily"],
    allergies: ["Ibuprofen"],
    comorbidities: [],
    labResults: { CRP: "18 mg/L", "Rheumatoid factor": "Positive" },
    icd: ["M06.9 - Rheumatoid arthritis, unspecified"],
    profile: { height: 165, weight: 61, smokingStatus: "Never smoker", alcoholConsumption: "None", exerciseFrequency: "Yoga weekly", functionalStatus: "Limited by morning stiffness", familyHistory: ["Grandmother: rheumatoid arthritis"] },
    visits: [
      {
        daysAgo: 9,
        title: "Rheumatology review",
        transcription:
          "Doctor: How are your joints doing on the methotrexate?\nPatient: My hands and wrists are still swollen. Mornings are the worst, it takes about two hours to loosen up.\nDoctor: How long have you been on fifteen milligrams a week?\nPatient: Almost six months. I take the folic acid too. I can't take ibuprofen, it gives me hives.\nDoctor: I count seven swollen joints today, and your CRP is eighteen. The methotrexate isn't controlling it well enough.\nPatient: What are the next options?\nDoctor: We could add a biologic, or there's an oral trial medication for people in exactly your situation.",
        symptoms: ["Swollen hands and wrists", "Morning stiffness over 2 hours"],
        vitals: { bloodPressure: "112/70 mmHg", heartRate: "76 bpm" },
        labResults: { CRP: "18 mg/L" },
        plan: "Continue methotrexate and folic acid. Discuss escalation: biologic or JAK inhibitor trial. Recheck CRP in 6 weeks.",
      },
    ],
    matches: [
      { trial: "ra", score: 84, reason: "Active rheumatoid arthritis with 7 swollen joints despite methotrexate.", status: "pending", notification: "pending", consent: "pending" },
    ],
  },
  {
    name: "Michael Brown",
    slug: "michael.brown",
    age: 67,
    gender: "male",
    location: "Phoenix, AZ, USA",
    conditions: [
      { name: "Heart failure with reduced ejection fraction", severity: "moderate" },
      { name: "Atrial fibrillation", severity: "moderate" },
    ],
    medications: ["Sacubitril-valsartan 49/51 mg twice daily", "Metoprolol succinate 50 mg daily", "Apixaban 5 mg twice daily", "Dapagliflozin 10 mg daily"],
    allergies: ["Codeine"],
    comorbidities: ["Hyperlipidemia"],
    labResults: { "Ejection fraction": "32%", "NT-proBNP": "1450 pg/mL" },
    icd: ["I50.22 - Chronic systolic heart failure", "I48.91 - Unspecified atrial fibrillation"],
    profile: { height: 182, weight: 94, smokingStatus: "Former smoker", alcoholConsumption: "Rare", exerciseFrequency: "Cardiac rehab twice weekly", functionalStatus: "NYHA class II", familyHistory: ["Brother: heart failure"] },
    visits: [
      {
        daysAgo: 45,
        title: "Heart failure clinic",
        transcription:
          "Doctor: Michael, how's your breathing since the hospital stay?\nPatient: Better. I can walk a block now without stopping. My ankles still swell by evening.\nDoctor: Are you weighing yourself every morning?\nPatient: Yes, I'm down four pounds this week.\nDoctor: Good. Your echo showed an ejection fraction of thirty two percent, and you're in atrial fibrillation with a controlled rate.\nPatient: I'm taking all the pills, including the blood thinner. I'm allergic to codeine.\nDoctor: I'm adding dapagliflozin today. It protects the heart and kidneys.",
        symptoms: ["Ankle swelling", "Breathlessness on exertion"],
        vitals: { bloodPressure: "118/72 mmHg", heartRate: "84 bpm irregular", weight: "94 kg" },
        plan: "Add dapagliflozin 10 mg. Daily weights. Cardiac rehabilitation. Recheck kidney function in 2 weeks.",
      },
      {
        daysAgo: 4,
        title: "Trial enrolment visit",
        transcription:
          "Doctor: You've started the study medication this week. Any side effects?\nPatient: None so far. The study nurse checked my potassium on Monday.\nDoctor: It was four point six, which is fine. How is your breathing?\nPatient: Good days and bad days, but no swelling this week.\nDoctor: Your NT pro BNP has come down to fourteen fifty. Keep going with the weights and rehab.\nPatient: I'm glad I signed up. It feels like someone's watching closely.",
        symptoms: ["Mild exertional breathlessness"],
        vitals: { bloodPressure: "116/70 mmHg", heartRate: "78 bpm irregular", weight: "92 kg" },
        labResults: { Potassium: "4.6 mmol/L", "NT-proBNP": "1450 pg/mL" },
        plan: "Continue trial medication and guideline therapy. Potassium and kidney function per study protocol. Follow up in 4 weeks.",
      },
    ],
    matches: [
      { trial: "hf", score: 90, reason: "HFrEF with ejection fraction 32%, NYHA class II, on SGLT2 inhibitor.", status: "enrolled", notification: "viewed", consent: "enrolled", doctorNotes: "Enrolled. Study visits every 4 weeks." },
    ],
  },
  {
    name: "Sofia Martinez",
    slug: "sofia.martinez",
    age: 24,
    gender: "female",
    location: "Houston, TX, USA",
    conditions: [
      { name: "Type 1 diabetes mellitus", severity: "moderate" },
      { name: "Celiac disease", severity: "mild" },
    ],
    medications: ["Insulin glargine 18 units nightly", "Insulin lispro with meals"],
    allergies: [],
    comorbidities: [],
    labResults: { HbA1c: "8.4%" },
    icd: ["E10.65 - Type 1 diabetes mellitus with hyperglycemia", "K90.0 - Celiac disease"],
    profile: { height: 168, weight: 60, smokingStatus: "Never smoker", alcoholConsumption: "Social", exerciseFrequency: "Running 3 times per week", functionalStatus: "Fully active", familyHistory: ["Father: hypothyroidism"] },
    visits: [
      {
        daysAgo: 3,
        title: "Diabetes clinic",
        transcription:
          "Doctor: Sofia, how have your sugars been since you started running more?\nPatient: All over the place. I go low after runs and then high at night.\nDoctor: Your HbA1c is eight point four. Are you still doing injections with every meal?\nPatient: Yes, glargine at night and lispro with meals. And I'm strict about gluten because of the celiac.\nDoctor: Have you thought about an insulin pump with a sensor?\nPatient: I'd love that, but my insurance hasn't approved one.\nDoctor: There's a closed-loop study in Houston for people your age. It might be a way to try one.",
        symptoms: ["Post-exercise hypoglycaemia", "Night-time hyperglycaemia"],
        vitals: { bloodPressure: "110/68 mmHg", heartRate: "64 bpm" },
        labResults: { HbA1c: "8.4%" },
        plan: "Adjust basal insulin. Exercise carbohydrate plan. Refer to closed-loop trial. Continuous glucose monitor education.",
      },
    ],
    matches: [
      { trial: "t1d", score: 86, reason: "Type 1 diabetes, age 24, HbA1c 8.4% on multiple daily injections.", status: "pending", notification: "sent", consent: "pending", doctorNotes: "Great fit for closed-loop study." },
    ],
  },
  {
    name: "Thomas Wright",
    slug: "thomas.wright",
    age: 49,
    gender: "male",
    location: "Boston, MA, USA",
    conditions: [
      { name: "Chronic kidney disease stage 3b", severity: "moderate" },
      { name: "Type 2 diabetes mellitus", severity: "moderate" },
    ],
    medications: ["Empagliflozin 10 mg daily", "Losartan 100 mg daily", "Insulin degludec 30 units daily"],
    allergies: ["Sulfonylureas"],
    comorbidities: ["Diabetic retinopathy"],
    labResults: { eGFR: "38 mL/min", UACR: "420 mg/g", HbA1c: "7.6%" },
    icd: ["N18.32 - Chronic kidney disease, stage 3b", "E11.22 - Type 2 diabetes mellitus with diabetic chronic kidney disease"],
    profile: { height: 177, weight: 101, smokingStatus: "Never smoker", alcoholConsumption: "Rare", exerciseFrequency: "Occasional", functionalStatus: "Independent", familyHistory: ["Father: kidney failure on dialysis"] },
    visits: [
      {
        daysAgo: 20,
        title: "Kidney function review",
        transcription:
          "Doctor: Thomas, your kidney function came back at thirty eight, a little lower than last time.\nPatient: My father ended up on dialysis. I really don't want that.\nDoctor: I understand. There's also a lot of protein in your urine, four hundred twenty on the ratio.\nPatient: I'm taking the empagliflozin and the losartan every day. Sulfonylureas made me sick, so I'm on insulin now.\nDoctor: Your blood pressure is one thirty eight over eighty four. We want it a bit lower to protect the kidneys.\nPatient: Is there anything else that could slow it down?\nDoctor: There's a kidney protection trial at the hospital. You might qualify, and I'll find out.",
        symptoms: ["Fatigue", "Foamy urine"],
        vitals: { bloodPressure: "138/84 mmHg", heartRate: "76 bpm" },
        labResults: { eGFR: "38 mL/min", UACR: "420 mg/g" },
        plan: "Continue empagliflozin and losartan. Tighten BP target. Nephrology referral. Discuss kidney protection trial.",
      },
    ],
    matches: [
      { trial: "ckd", score: 81, reason: "Diabetic CKD with eGFR 38 and albuminuria 420 mg/g.", status: "pending", notification: "pending", consent: "pending" },
      { trial: "t2d", score: 70, reason: "Type 2 diabetes with hypertension; HbA1c 7.6%.", status: "declined", notification: "viewed", consent: "declined", doctorNotes: "Patient prefers to focus on the kidney study." },
    ],
  },
];

// Story attached to the real signed-in patient so the patient portal has content too.
const OWN_PATIENT_STORY: Story = {
  age: 47,
  gender: "",
  location: "Boston, MA, USA",
  conditions: [
    { name: "Type 2 diabetes mellitus", severity: "moderate" },
    { name: "Hypertension", severity: "mild" },
    { name: "Stable angina", severity: "mild" },
  ],
  medications: ["Metformin 500 mg twice daily", "Lisinopril 10 mg daily"],
  allergies: ["Penicillin"],
  comorbidities: ["Obesity"],
  labResults: { HbA1c: "8.1%" },
  icd: ["E11.65 - Type 2 diabetes mellitus with hyperglycemia", "I10 - Essential hypertension", "I20.9 - Angina pectoris, unspecified"],
  profile: { height: 172, weight: 84, smokingStatus: "Never smoker", alcoholConsumption: "Occasional", exerciseFrequency: "2 times per week", functionalStatus: "Independent", familyHistory: ["Mother: type 2 diabetes"] },
  visits: [
    {
      daysAgo: 35,
      title: "New patient visit",
      transcription:
        "Doctor: Welcome. What would you like to focus on today?\nPatient: My last checkup showed high blood sugar, and I've been tired all the time.\nDoctor: Any increased thirst or getting up at night to urinate?\nPatient: Both, actually. My mother has type two diabetes.\nDoctor: Your blood pressure is one forty four over ninety. Do you take any medicines?\nPatient: Just lisinopril. I'm allergic to penicillin.\nDoctor: Let's check an HbA1c and kidney function, and I'll start you on metformin five hundred milligrams twice a day.",
      symptoms: ["Fatigue", "Increased thirst", "Nocturia"],
      vitals: { bloodPressure: "144/90 mmHg", heartRate: "80 bpm" },
      plan: "Start metformin 500 mg BID. HbA1c, kidney function, lipid panel. Diet counselling. Follow up in 4 weeks.",
    },
    {
      daysAgo: 5,
      title: "Follow-up consultation",
      transcription:
        "Doctor: How have you been feeling since we started the metformin?\nPatient: A bit better, but I'm still thirsty and tired, and I get chest tightness on the stairs.\nDoctor: Your HbA1c came back at eight point one, and your blood pressure today is one forty two over ninety.\nPatient: Is the metformin not working?\nDoctor: It's working, but it needs time and maybe a higher dose. The chest tightness sounds like stable angina, so I'd also like a stress test.\nPatient: Okay.\nDoctor: I'll also check whether any clinical trials fit your situation and send you the details.",
      symptoms: ["Increased thirst", "Fatigue", "Exertional chest tightness"],
      vitals: { bloodPressure: "142/90 mmHg", heartRate: "76 bpm" },
      labResults: { HbA1c: "8.1%" },
      plan: "Adjust diabetes therapy. Home blood pressure log. Stress test referral. Review trial options at follow-up.",
    },
  ],
};

function buildReport(s: Story, visit: Visit): string {
  const conditions = s.conditions.map((c) => c.name).join(", ");
  const vitals = Object.entries(visit.vitals).map(([k, val]) => `${k}: ${val}`).join("; ");
  const labs = Object.entries({ ...s.labResults, ...visit.labResults }).map(([k, val]) => `${k} ${val}`).join("; ") || "None reported";
  return [
    "**S (Subjective):**",
    `${s.age}-year-old ${s.gender || "patient"} reporting ${visit.symptoms.join(", ").toLowerCase()}. Current medications: ${s.medications.join(", ")}. Allergies: ${s.allergies.join(", ") || "None known"}.`,
    "",
    "**O (Objective):**",
    `Vital signs: ${vitals}. Laboratory: ${labs}. Physical examination: Not documented in this consultation.`,
    "",
    "**A (Assessment):**",
    conditions + ".",
    "",
    "**P (Plan):**",
    visit.plan,
    "",
    "**ICD-10 Codes:**",
    s.icd.join("\n"),
  ].join("\n");
}

function medicalProfile(s: Story, now: number) {
  const symptoms = s.visits[s.visits.length - 1].symptoms;
  return {
    ...s.profile,
    bmi: Math.round((s.profile.weight / (s.profile.height / 100) ** 2) * 10) / 10,
    currentSymptoms: symptoms,
    willingToTravel: true,
    maxTravelDistance: 50,
    profileCompleted: true,
    lastProfileUpdate: now,
  };
}

async function addConsultation(
  ctx: MutationCtx,
  args: {
    doctorId: Id<"users">;
    patientId: Id<"users">;
    story: Story;
    visit: Visit;
    shared: boolean;
  }
) {
  const start = Date.now() - args.visit.daysAgo * DAY;
  const meetingId = await ctx.db.insert("meetings", {
    doctorId: args.doctorId,
    patientId: args.patientId,
    title: args.visit.title,
    description: "Review of symptoms, medications and test results",
    scheduledDate: start,
    duration: 30,
    status: "completed",
    type: "follow-up",
    notes: SEED_NOTE,
    location: "Clinic Room 2",
    createdAt: start - 3 * DAY,
  });
  const s = args.story;
  return await ctx.db.insert("consultations", {
    doctorId: args.doctorId,
    patientId: args.patientId,
    meetingId,
    transcription: args.visit.transcription,
    structuredData: {
      conditions: s.conditions,
      medications: s.medications,
      allergies: s.allergies,
      labResults: { ...s.labResults, ...args.visit.labResults },
      comorbidities: s.comorbidities,
      vitals: args.visit.vitals,
      symptoms: args.visit.symptoms,
    },
    medicalReport: buildReport(s, args.visit),
    reportGeneratedAt: start + 45 * 60_000,
    sharedWithPatient: args.shared,
    sharedAt: args.shared ? start + 60 * 60_000 : undefined,
    status: "completed",
    startTime: start,
    endTime: start + 30 * 60_000,
    createdAt: start,
    updatedAt: start + 60 * 60_000,
  });
}

// Adds every visit in the story; returns the latest consultation.
async function addVisits(
  ctx: MutationCtx,
  doctorId: Id<"users">,
  patientId: Id<"users">,
  story: Story,
  shareLatest: boolean
) {
  let latest: Id<"consultations"> | null = null;
  for (const [i, visit] of story.visits.entries()) {
    const isLatest = i === story.visits.length - 1;
    latest = await addConsultation(ctx, {
      doctorId,
      patientId,
      story,
      visit,
      shared: isLatest ? shareLatest : true,
    });
  }
  return latest!;
}

async function addUpcomingMeetings(
  ctx: MutationCtx,
  doctorId: Id<"users">,
  patientId: Id<"users">,
  offsetsInDays: number[]
) {
  const now = Date.now();
  const types = ["follow-up", "check-up", "consultation"] as const;
  let i = 0;
  for (const days of offsetsInDays) {
    const when = new Date(now + days * DAY);
    when.setHours(9 + (i % 4) * 2, 0, 0, 0);
    await ctx.db.insert("meetings", {
      doctorId,
      patientId,
      title: i === 0 ? "Follow-up visit" : "Routine check-up",
      description: "Scheduled review with your doctor",
      scheduledDate: when.getTime(),
      duration: 30,
      status: "scheduled",
      type: types[i % types.length],
      notes: SEED_NOTE,
      location: "Clinic Room 2",
      createdAt: now,
    });
    i++;
  }
}

async function addMatch(
  ctx: MutationCtx,
  args: {
    patientId: Id<"users">;
    trialId: Id<"clinicalTrials">;
    consultationId: Id<"consultations">;
  } & Omit<Match, "trial">
) {
  const now = Date.now();
  const history: {
    status: MatchStatus;
    timestamp: number;
    changedBy: "doctor" | "patient" | "system";
    userId?: Id<"users">;
    note?: string;
  }[] = [{ status: "pending", timestamp: now - 2 * DAY, changedBy: "system", note: "Match created from consultation" }];
  if (args.consent !== "pending") {
    history.push({ status: args.consent, timestamp: now - DAY, changedBy: "patient", userId: args.patientId });
  }
  await ctx.db.insert("trialMatches", {
    patientId: args.patientId,
    trialId: args.trialId,
    consultationId: args.consultationId,
    relevanceScore: args.score,
    matchReason: args.reason,
    status: args.status,
    notificationStatus: args.notification,
    consentStatus: args.consent,
    consentStatusHistory: history,
    doctorNotes: args.doctorNotes,
    matchDate: now - 2 * DAY,
    responseDate: args.consent !== "pending" ? now - DAY : undefined,
    createdAt: now - 2 * DAY,
    updatedAt: now,
  });
  const consultation = await ctx.db.get(args.consultationId);
  await ctx.db.patch(args.consultationId, {
    matchedTrialIds: [...(consultation?.matchedTrialIds ?? []), args.trialId],
  });
}

export const seedDemoData = internalMutation({
  args: {
    doctorEmail: v.optional(v.string()),
    patientEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const isSeeded = (u: { tokenIdentifier?: string }) =>
      u.tokenIdentifier?.startsWith(SEED_TOKEN_PREFIX) ?? false;

    const doctors = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();
    const doctor = args.doctorEmail
      ? doctors.find((d) => d.email === args.doctorEmail)
      : doctors.find((d) => !isSeeded(d));
    if (!doctor) {
      throw new Error(
        "No doctor account found. Sign in to the app, choose the Doctor role, then run this again."
      );
    }

    const allPatients = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "patient"))
      .collect();
    const summary: string[] = [];
    const now = Date.now();

    // Trials are shared by both parts below
    const existingTrials = (await ctx.db.query("clinicalTrials").collect()).filter((t) =>
      t.nctId?.startsWith(SEED_NCT_PREFIX)
    );
    const trialIds: Record<string, Id<"clinicalTrials">> = {};
    if (existingTrials.length === 0) {
      for (const [i, t] of TRIALS.entries()) {
        trialIds[t.key] = await ctx.db.insert("clinicalTrials", {
          title: t.title,
          description: t.description,
          sponsor: t.sponsor,
          phase: t.phase,
          status: "recruiting",
          nctId: `${SEED_NCT_PREFIX}${String(i + 1).padStart(3, "0")}`,
          eligibilityCriteria: [...t.eligibilityCriteria],
          exclusionCriteria: [...t.exclusionCriteria],
          location: t.location,
          locations: [t.location],
          contactInfo: "trials@demo.medibuddy.test",
          targetConditions: [...t.targetConditions],
          ageRange: t.ageRange,
          genderRestriction: "genderRestriction" in t ? t.genderRestriction : undefined,
          createdAt: now,
        });
      }
    } else {
      for (const [i, t] of TRIALS.entries()) {
        const row = existingTrials.find(
          (r) => r.nctId === `${SEED_NCT_PREFIX}${String(i + 1).padStart(3, "0")}`
        );
        if (row) trialIds[t.key] = row._id;
      }
    }

    // Part A: fictional patients for the doctor portal
    if (allPatients.some(isSeeded)) {
      summary.push("Demo patients already exist, skipped. Run seed:resetDemoData first to reseed.");
    } else {
      let consultations = 0;
      for (const [i, p] of PATIENTS.entries()) {
        const patientId = await ctx.db.insert("users", {
          name: p.name,
          email: `${p.slug}@demo.medibuddy.test`,
          tokenIdentifier: `${SEED_TOKEN_PREFIX}patient-${i + 1}`,
          role: "patient",
          roleConfirmed: true,
          age: p.age,
          gender: p.gender,
          location: p.location,
          conditions: p.conditions,
          medications: p.medications,
          allergies: p.allergies,
          comorbidities: p.comorbidities,
          labResults: p.labResults,
          medicalProfile: medicalProfile(p, now),
          createdAt: now,
        });
        const latest = await addVisits(ctx, doctor._id, patientId, p, i % 4 !== 3);
        consultations += p.visits.length;
        await addUpcomingMeetings(ctx, doctor._id, patientId, [1 + (i % 7), 9 + i * 2]);
        for (const { trial, ...m } of p.matches) {
          if (!trialIds[trial]) continue;
          await addMatch(ctx, { patientId, trialId: trialIds[trial], consultationId: latest, ...m });
        }
      }
      summary.push(
        `Created ${PATIENTS.length} demo patients, ${consultations} consultations and ${TRIALS.length} trials for ${doctor.name ?? doctor.email}.`
      );
    }

    // Part B: attach demo records to the real signed-in patient
    const realPatients = allPatients.filter((p) => !isSeeded(p));
    const realPatient = args.patientEmail
      ? realPatients.find((p) => p.email === args.patientEmail)
      : realPatients[0];
    if (!realPatient) {
      summary.push("No signed-in patient found. Sign in as a patient, then run this again to add records for them.");
    } else {
      const existing = await ctx.db
        .query("meetings")
        .withIndex("by_patient", (q) => q.eq("patientId", realPatient._id))
        .filter((q) => q.eq(q.field("notes"), SEED_NOTE))
        .first();
      if (existing) {
        summary.push("Records for the signed-in patient already exist, skipped.");
      } else {
        const s = OWN_PATIENT_STORY;
        if (!realPatient.conditions?.length) {
          await ctx.db.patch(realPatient._id, {
            age: realPatient.age ?? s.age,
            location: realPatient.location ?? s.location,
            conditions: s.conditions,
            medications: s.medications,
            allergies: s.allergies,
            comorbidities: s.comorbidities,
            labResults: s.labResults,
            medicalProfile: medicalProfile(s, now),
          });
        }
        const latest = await addVisits(ctx, doctor._id, realPatient._id, s, true);
        await addUpcomingMeetings(ctx, doctor._id, realPatient._id, [2, 9]);
        const ownMatches: Match[] = [
          { trial: "t2d", score: 85, reason: "Type 2 diabetes with HbA1c 8.1% on metformin; hypertension present.", status: "pending", notification: "sent", consent: "pending", doctorNotes: "Worth discussing. You can approve or decline sharing your details." },
          { trial: "angina", score: 72, reason: "Exertional chest tightness with cardiac risk factors.", status: "pending", notification: "sent", consent: "pending" },
        ];
        for (const { trial, ...m } of ownMatches) {
          if (!trialIds[trial]) continue;
          await addMatch(ctx, { patientId: realPatient._id, trialId: trialIds[trial], consultationId: latest, ...m });
        }
        summary.push(
          `Added ${s.visits.length} consultations, 2 upcoming appointments and 2 trial matches for ${realPatient.name ?? realPatient.email}.`
        );
      }
    }
    return summary;
  },
});

async function deleteConsultationTree(ctx: MutationCtx, consultationId: Id<"consultations">) {
  const counts = { matches: 0, audio: 0, interactions: 0 };
  for (const m of await ctx.db
    .query("trialMatches")
    .withIndex("by_consultation", (q) => q.eq("consultationId", consultationId))
    .collect()) {
    await ctx.db.delete(m._id);
    counts.matches++;
  }
  for (const a of await ctx.db
    .query("audioRecordings")
    .withIndex("by_consultation", (q) => q.eq("consultationId", consultationId))
    .collect()) {
    await ctx.storage.delete(a.fileId as Id<"_storage">).catch(() => {});
    await ctx.db.delete(a._id);
    counts.audio++;
  }
  for (const i of await ctx.db
    .query("asi1Interactions")
    .withIndex("by_consultation", (q) => q.eq("consultationId", consultationId))
    .collect()) {
    await ctx.db.delete(i._id);
    counts.interactions++;
  }
  await ctx.db.delete(consultationId);
  return counts;
}

export const resetDemoData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const totals = { meetings: 0, consultations: 0, matches: 0, audio: 0, patients: 0, trials: 0 };
    const seededMeetings = await ctx.db
      .query("meetings")
      .filter((q) => q.eq(q.field("notes"), SEED_NOTE))
      .collect();
    for (const m of seededMeetings) {
      const linked = await ctx.db
        .query("consultations")
        .withIndex("by_meeting", (q) => q.eq("meetingId", m._id))
        .collect();
      for (const c of linked) {
        const counts = await deleteConsultationTree(ctx, c._id);
        totals.matches += counts.matches;
        totals.audio += counts.audio;
        totals.consultations++;
      }
      await ctx.db.delete(m._id);
      totals.meetings++;
    }
    for (const u of await ctx.db.query("users").collect()) {
      if (u.tokenIdentifier?.startsWith(SEED_TOKEN_PREFIX)) {
        await ctx.db.delete(u._id);
        totals.patients++;
      }
    }
    for (const t of await ctx.db.query("clinicalTrials").collect()) {
      if (t.nctId?.startsWith(SEED_NCT_PREFIX)) {
        await ctx.db.delete(t._id);
        totals.trials++;
      }
    }
    return totals;
  },
});

// ---- audio seeding (used by scripts/seed_audio.py) ----

// Seeded consultations that have a transcript but no recording yet.
export const consultationsNeedingAudio = internalQuery({
  args: {},
  handler: async (ctx) => {
    const result = [];
    for (const c of await ctx.db.query("consultations").collect()) {
      if (!c.transcription || c.audioRecordingId || !c.meetingId) continue;
      const meeting = await ctx.db.get(c.meetingId);
      if (meeting?.notes !== SEED_NOTE) continue;
      const patient = await ctx.db.get(c.patientId);
      result.push({
        consultationId: c._id,
        transcription: c.transcription,
        patientName: patient?.name ?? "patient",
        patientGender: patient?.gender ?? "",
      });
    }
    return result;
  },
});

export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

// Links an uploaded file as the consultation's recording. The transcript is already the text that
// was spoken, so the recording is stored as transcribed and no transcription job is scheduled.
export const attachAudio = internalMutation({
  args: {
    consultationId: v.id("consultations"),
    storageId: v.string(),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) throw new Error("Consultation not found");
    const at = consultation.startTime + 30 * 60_000;
    const audioRecordingId = await ctx.db.insert("audioRecordings", {
      consultationId: args.consultationId,
      fileId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      duration: args.duration,
      status: "completed",
      uploadTime: at,
      transcriptionTime: at + 60_000,
      createdAt: at,
    });
    await ctx.db.patch(args.consultationId, { audioRecordingId });
    return audioRecordingId;
  },
});

// ---- maintenance ----

// Removes consultations where the doctor is also the patient (created by an old
// "Start Consultation" fallback), together with their matches, audio and ASI-1 records.
export const removeSelfConsultations = internalMutation({
  args: {},
  handler: async (ctx) => {
    let removed = 0;
    for (const c of await ctx.db.query("consultations").collect()) {
      if (c.doctorId === c.patientId) {
        await deleteConsultationTree(ctx, c._id);
        removed++;
      }
    }
    return { removed };
  },
});

// Removes records created after `since` (ms timestamp) that are not demo seed data.
// Used to clean up after manual end-to-end test runs:
//   npx convex run seed:cleanupSince '{"since": 1700000000000}'
export const cleanupSince = internalMutation({
  args: { since: v.number() },
  handler: async (ctx, args) => {
    const counts = { consultations: 0, meetings: 0, matches: 0, audio: 0, interactions: 0 };
    for (const c of await ctx.db.query("consultations").collect()) {
      if ((c.createdAt ?? c._creationTime) < args.since) continue;
      const removed = await deleteConsultationTree(ctx, c._id);
      counts.matches += removed.matches;
      counts.audio += removed.audio;
      counts.interactions += removed.interactions;
      counts.consultations++;
    }
    for (const m of await ctx.db.query("meetings").collect()) {
      if (m.createdAt >= args.since && m.notes !== SEED_NOTE) {
        await ctx.db.delete(m._id);
        counts.meetings++;
      }
    }
    return counts;
  },
});
