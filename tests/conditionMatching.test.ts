import { describe, expect, test } from "vitest";
import { conditionsMatch } from "../convex/conditionMatching";

describe("conditionsMatch", () => {
  test.each([
    ["Chronic obstructive pulmonary disease", "COPD"],
    ["COPD", "Chronic Obstructive Pulmonary Disease"],
    ["Type 2 diabetes mellitus", "Type 2 Diabetes"],
    ["T2DM", "Type 2 Diabetes"],
    ["High blood pressure", "Hypertension"],
    ["MCI", "Mild Cognitive Impairment"],
    ["Alzheimer's disease", "Alzheimer Disease"],
    ["Parkinson's disease", "Parkinsons Disease"],
    ["Rheumatoid arthritis", "RA"],
    ["Breast cancer, hormone receptor positive, stage II", "Breast Cancer"],
    ["Migraine without aura", "Migraine"],
    ["Chronic kidney disease stage 3", "CKD"],
    ["Heart failure with reduced ejection fraction", "Heart Failure"],
  ])("%s matches %s", (patient, trial) => {
    expect(conditionsMatch(patient, trial)).toBe(true);
  });

  test.each([
    ["Type 1 diabetes mellitus", "Type 2 Diabetes"],
    ["Type 2 diabetes mellitus", "Type 1 Diabetes"],
    ["Stable angina", "Coronary Artery Disease"],
    ["Mild cognitive impairment", "Alzheimer's Disease"],
    ["Sinus bradycardia", "Rheumatoid Arthritis"],
    ["Acute bronchitis", "COPD"],
    ["Atrial fibrillation", "Heart Failure"],
  ])("%s does not match %s", (patient, trial) => {
    expect(conditionsMatch(patient, trial)).toBe(false);
  });
});
