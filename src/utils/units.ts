export type UnitSystem = 'metric' | 'imperial';

// ── Conversion constants ──
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;
const CM_TO_INCHES = 0.393701;
const INCHES_TO_CM = 2.54;

// ── Weight conversions ──
export const kgToLbs = (kg: number): number => Math.round(kg * KG_TO_LBS * 10) / 10;
export const lbsToKg = (lbs: number): number => Math.round(lbs * LBS_TO_KG * 10) / 10;

// ── Height conversions ──
export const cmToInches = (cm: number): number => Math.round(cm * CM_TO_INCHES * 10) / 10;
export const inchesToCm = (inches: number): number => Math.round(inches * INCHES_TO_CM * 10) / 10;

export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm * CM_TO_INCHES;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches: inches === 12 ? 0 : inches };
};

export const feetInchesToCm = (feet: number, inches: number): number =>
  Math.round((feet * 12 + inches) * INCHES_TO_CM * 10) / 10;

// ── Formatting ──

/** Format weight for display: "70 kg" or "154.3 lbs" */
export const formatWeight = (kg: number, system: UnitSystem): string => {
  if (system === 'imperial') return `${kgToLbs(kg)} lbs`;
  return `${kg} kg`;
};

/** Format height for display: "180 cm" or "5'11\"" */
export const formatHeight = (cm: number, system: UnitSystem): string => {
  if (system === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}'${inches}"`;
  }
  return `${cm} cm`;
};

/** Convert a weight value from the user's input unit to kg for storage */
export const weightToKg = (value: number, system: UnitSystem): number =>
  system === 'imperial' ? lbsToKg(value) : value;

/** Convert kg from storage to the user's display unit */
export const weightFromKg = (kg: number, system: UnitSystem): number =>
  system === 'imperial' ? kgToLbs(kg) : kg;

/** Get the weight unit label */
export const weightUnit = (system: UnitSystem): string =>
  system === 'imperial' ? 'lbs' : 'kg';

/** Get the height unit label */
export const heightUnit = (system: UnitSystem): string =>
  system === 'imperial' ? 'ft/in' : 'cm';

/** Detect system from device region. US, UK, Liberia, Myanmar use imperial. */
export const detectUnitSystem = (): UnitSystem => {
  try {
    const Localization = require('expo-localization');
    const region = Localization.getLocales()[0]?.regionCode?.toUpperCase();
    const imperialRegions = ['US', 'LR', 'MM', 'GB'];
    return imperialRegions.includes(region) ? 'imperial' : 'metric';
  } catch {
    return 'metric';
  }
};
