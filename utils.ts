
import { WEEKDAYS, WAGE_FACTORS } from './constants';
import { TimeEntry } from './types';

export const timeToDecimal = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours + minutes / 60;
};

export const decimalToTime = (decimal: number): string => {
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const roundTo = (decimal: number, minutes: number): number => {
  const step = minutes / 60;
  return Math.round(decimal / step) * step;
};

/**
 * Berechnet die Gesamtstunden basierend auf Vormittags- und Nachmittagssegmenten.
 * Unterstützt auch einzelne Segmente (z.B. nur StartM & Lunch).
 */
export const calculateTotalHours = (
  startM: string, 
  lunch: string, 
  startN: string, 
  end: string
): number => {
  const t1 = startM ? timeToDecimal(startM) : null;
  const t2 = lunch ? timeToDecimal(lunch) : null;
  const t3 = startN ? timeToDecimal(startN) : null;
  const t4 = end ? timeToDecimal(end) : null;
  
  let total = 0;

  // Segment 1: Vormittag
  if (t1 !== null && t2 !== null) {
    total += Math.max(0, t2 - t1);
  }

  // Segment 2: Nachmittag
  if (t3 !== null && t4 !== null) {
    total += Math.max(0, t4 - t3);
  }

  // Spezialfall: Nur Beginn und Ende eingetragen (ein durchgehender Block)
  if (t1 !== null && t2 === null && t3 === null && t4 !== null) {
    total = Math.max(0, t4 - t1);
  }

  return total;
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const getWeekday = (dateStr: string): string => {
  const date = new Date(dateStr);
  return WEEKDAYS[date.getDay()];
};

export const getMonthName = (monthIndex: number): string => {
  return new Intl.DateTimeFormat('de-DE', { month: 'long' }).format(new Date(2000, monthIndex));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount);
};

export const getMonthlyCompanyHours = (entries: TimeEntry[], companyKey: 'med' | 'bau' | 'cursum', month: number, year: number): number => {
  return entries
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + (e.splits[companyKey] || 0), 0);
};

/**
 * Berechnet die Anzahl der Arbeitstage (Mo-Fr) in einem Zeitraum
 */
export const countBusinessDays = (start: Date, end: Date): number => {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// Detaillierte Lohnberechnung nach Nutzerwunsch
export interface WageBreakdown {
  baseRate: number;
  ferien: number;
  feiertag: number;
  subtotal1: number; // Basis + Ferien + Feiertag
  thirteenth: number; // Berechnet auf subtotal1
  grossRate: number; // subtotal1 + thirteenth
  ahv: number;
  alv: number;
  nbu: number;
  uvgz: number;
  ktg: number;
  totalDeductions: number;
  netRate: number;
}

export const calculateWageBreakdown = (baseRate: number): WageBreakdown => {
  const ferien = baseRate * WAGE_FACTORS.FERIEN;
  const feiertag = baseRate * WAGE_FACTORS.FEIERTAG;
  const subtotal1 = baseRate + ferien + feiertag;
  const thirteenth = subtotal1 * WAGE_FACTORS.THIRTEENTH;
  const grossRate = subtotal1 + thirteenth;

  const ahv = grossRate * WAGE_FACTORS.AHV;
  const alv = grossRate * WAGE_FACTORS.ALV;
  const nbu = grossRate * WAGE_FACTORS.NBU;
  const uvgz = grossRate * WAGE_FACTORS.UVGZ;
  const ktg = grossRate * WAGE_FACTORS.KTG;
  
  const totalDeductions = ahv + alv + nbu + uvgz + ktg;
  const netRate = grossRate - totalDeductions;

  return {
    baseRate,
    ferien,
    feiertag,
    subtotal1,
    thirteenth,
    grossRate,
    ahv,
    alv,
    nbu,
    uvgz,
    ktg,
    totalDeductions,
    netRate
  };
};

export const getMonthlyHours = (entries: TimeEntry[], month: number, year: number): number => {
  return entries
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, e) => sum + e.totalHours, 0);
};
