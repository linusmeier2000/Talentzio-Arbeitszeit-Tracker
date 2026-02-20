
import { UserSettings, TimeEntry } from './types';

export const COMPANIES = {
  MAIN: 'Talentzio AG',
  MED: 'Talentzio Med AG',
  BAU: 'Talentzio Bau AG',
  CURSUM: 'Cursum AG'
} as const;

// Lohn-Konstanten (Prozentuale Werte)
export const WAGE_FACTORS = {
  // Zuzüge
  FERIEN: 0.1064,      // 10.64%
  FEIERTAG: 0.015,    // 1.5%
  THIRTEENTH: 0.08333, // 8.333%
  
  // Abzüge
  AHV: 0.053,         // 5.3%
  ALV: 0.011,         // 1.1%
  NBU: 0.0073,        // 0.73%
  UVGZ: 0.00095,      // 0.095%
  KTG: 0.0039         // 0.39%
};

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Linus Meier',
  wages: [{ rate: 33, validFrom: '2024-01-01' }],
  roundingMinutes: 5,
  defaultStartM: '08:05',
  defaultLunch: '12:05',
  defaultStartN: '12:50',
  defaultEnd: '17:50',
  lastExportDate: null
};

export const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const parseImportDate = (d: string) => {
  const [day, month, year] = d.split('.');
  return `${year}-${month}-${day}`;
};

const parseImportTime = (t: string) => t === 'leer' ? '' : t.replace(' Uhr', '');
const parseImportHours = (h: string) => h === 'leer' ? 0 : parseFloat(h.replace(',', '.').replace(' h', ''));

const rawData = [
  { d: "03.01.2025", bm: "09:15 Uhr", m: "10:00 Uhr", bn: "leer", f: "leer", h: "0,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "08.01.2025", bm: "09:00 Uhr", m: "12:15 Uhr", bn: "13:00 Uhr", f: "17:30 Uhr", h: "7,75 h", med: "leer", bau: "leer", cur: "3,50 h" },
  { d: "09.01.2025", bm: "08:25 Uhr", m: "12:20 Uhr", bn: "12:50 Uhr", f: "17:30 Uhr", h: "8,58 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "10.01.2025", bm: "11:00 Uhr", m: "11:30 Uhr", bn: "leer", f: "leer", h: "0,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "16.01.2025", bm: "08:25 Uhr", m: "12:15 Uhr", bn: "12:45 Uhr", f: "17:30 Uhr", h: "8,58 h", med: "leer", bau: "leer", cur: "7,00 h" },
  { d: "17.01.2025", bm: "08:25 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:30 Uhr", h: "8,58 h", med: "leer", bau: "leer", cur: "4,00 h" },
  { d: "22.01.2025", bm: "08:25 Uhr", m: "12:15 Uhr", bn: "12:55 Uhr", f: "17:30 Uhr", h: "8,42 h", med: "leer", bau: "leer", cur: "6,00 h" },
  { d: "23.01.2025", bm: "08:25 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:30 Uhr", h: "8,42 h", med: "leer", bau: "leer", cur: "4,00 h" },
  { d: "27.01.2025", bm: "11:30 Uhr", m: "14:15 Uhr", bn: "leer", f: "leer", h: "2,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "28.01.2025", bm: "09:00 Uhr", m: "10:15 Uhr", bn: "16:00 Uhr", f: "17:30 Uhr", h: "2,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "30.01.2025", bm: "08:25 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:30 Uhr", h: "8,50 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "31.01.2025", bm: "08:25 Uhr", m: "12:10 Uhr", bn: "12:55 Uhr", f: "17:30 Uhr", h: "8,33 h", med: "2,00 h", bau: "leer", cur: "1,50 h" },
  { d: "06.02.2025", bm: "08:25 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "8,83 h", med: "4,00 h", bau: "leer", cur: "leer" },
  { d: "07.02.2025", bm: "08:25 Uhr", m: "12:10 Uhr", bn: "12:50 Uhr", f: "18:10 Uhr", h: "9,08 h", med: "1,00 h", bau: "leer", cur: "2,00 h" },
  { d: "10.02.2025", bm: "16:00 Uhr", m: "17:00 Uhr", bn: "leer", f: "leer", h: "1,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "13.02.2025", bm: "17:30 Uhr", m: "18:15 Uhr", bn: "leer", f: "leer", h: "0,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "20.02.2025", bm: "08:25 Uhr", m: "12:10 Uhr", bn: "12:45 Uhr", f: "17:30 Uhr", h: "8,50 h", med: "leer", bau: "leer", cur: "3,50 h" },
  { d: "21.02.2025", bm: "08:25 Uhr", m: "12:05 Uhr", bn: "13:00 Uhr", f: "17:30 Uhr", h: "8,17 h", med: "leer", bau: "leer", cur: "2,00 h" },
  { d: "27.02.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "03.03.2025", bm: "14:00 Uhr", m: "16:00 Uhr", bn: "leer", f: "leer", h: "2,00 h", med: "1,25 h", bau: "leer", cur: "leer" },
  { d: "05.03.2025", bm: "09:30 Uhr", m: "11:30 Uhr", bn: "leer", f: "leer", h: "2,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "07.03.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:55 Uhr", h: "9,17 h", med: "1,00 h", bau: "leer", cur: "1,00 h" },
  { d: "13.03.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:55 Uhr", f: "17:45 Uhr", h: "8,92 h", med: "leer", bau: "leer", cur: "2,00 h" },
  { d: "14.03.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "16:50 Uhr", h: "8,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "18.03.2025", bm: "14:10 Uhr", m: "15:30 Uhr", bn: "leer", f: "leer", h: "1,33 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "19.03.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:55 Uhr", f: "17:45 Uhr", h: "8,83 h", med: "5,00 h", bau: "leer", cur: "leer" },
  { d: "20.03.2025", bm: "08:05 Uhr", m: "10:40 Uhr", bn: "leer", f: "leer", h: "2,58 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "20.03.2025", bm: "10:40 Uhr", m: "12:05 Uhr", bn: "12:55 Uhr", f: "17:45 Uhr", h: "6,25 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "26.03.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "17:45 Uhr", h: "8,83 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "27.03.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:45 Uhr", f: "17:45 Uhr", h: "8,92 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "03.04.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "04.04.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "17:45 Uhr", h: "8,83 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "07.04.2025", bm: "14:15 Uhr", m: "14:45 Uhr", bn: "leer", f: "leer", h: "0,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "10.04.2025", bm: "08:05 Uhr", m: "11:55 Uhr", bn: "12:35 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "11.04.2025", bm: "08:05 Uhr", m: "11:50 Uhr", bn: "12:50 Uhr", f: "17:15 Uhr", h: "8,17 h", med: "3,00 h", bau: "leer", cur: "3,00 h" },
  { d: "16.04.2025", bm: "08:05 Uhr", m: "11:55 Uhr", bn: "12:50 Uhr", f: "17:45 Uhr", h: "8,75 h", med: "leer", bau: "leer", cur: "2,00 h" },
  { d: "17.04.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "16:45 Uhr", h: "7,83 h", med: "1,50 h", bau: "leer", cur: "leer" },
  { d: "23.04.2025", bm: "08:05 Uhr", m: "11:55 Uhr", bn: "12:45 Uhr", f: "17:45 Uhr", h: "8,83 h", med: "1,50 h", bau: "leer", cur: "leer" },
  { d: "24.04.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "18:30 Uhr", h: "9,58 h", med: "2,50 h", bau: "leer", cur: "leer" },
  { d: "30.04.2025", bm: "08:05 Uhr", m: "12:20 Uhr", bn: "13:00 Uhr", f: "17:20 Uhr", h: "8,58 h", med: "3,50 h", bau: "leer", cur: "leer" },
  { d: "02.05.2025", bm: "08:05 Uhr", m: "12:20 Uhr", bn: "13:10 Uhr", f: "17:25 Uhr", h: "8,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "08.05.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "09.05.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:10 Uhr", h: "8,42 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "15.05.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "1,00 h", bau: "leer", cur: "1,00 h" },
  { d: "16.05.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:40 Uhr", h: "8,92 h", med: "3,50 h", bau: "leer", cur: "leer" },
  { d: "19.05.2025", bm: "14:00 Uhr", m: "17:00 Uhr", bn: "leer", f: "leer", h: "3,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "21.05.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "13:10 Uhr", f: "17:40 Uhr", h: "8,58 h", med: "1,50 h", bau: "leer", cur: "leer" },
  { d: "22.05.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:35 Uhr", f: "17:40 Uhr", h: "9,08 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "23.05.2025", bm: "12:45 Uhr", m: "14:15 Uhr", bn: "leer", f: "leer", h: "1,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "24.05.2025", bm: "13:30 Uhr", m: "14:15 Uhr", bn: "leer", f: "leer", h: "0,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "28.05.2025", bm: "08:50 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "16:45 Uhr", h: "7,17 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "30.05.2025", bm: "09:30 Uhr", m: "11:30 Uhr", bn: "16:45 Uhr", f: "17:30 Uhr", h: "2,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "05.06.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "06.06.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "17:25 Uhr", h: "8,58 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "07.06.2025", bm: "09:30 Uhr", m: "10:10 Uhr", bn: "leer", f: "leer", h: "0,67 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "11.06.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "17:45 Uhr", h: "8,83 h", med: "3,00 h", bau: "leer", cur: "leer" },
  { d: "12.06.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:55 Uhr", f: "17:45 Uhr", h: "8,92 h", med: "3,00 h", bau: "leer", cur: "leer" },
  { d: "16.06.2025", bm: "11:20 Uhr", m: "12:00 Uhr", bn: "12:30 Uhr", f: "13:00 Uhr", h: "1,17 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "18.06.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "13:00 Uhr", f: "17:45 Uhr", h: "8,67 h", med: "6,00 h", bau: "leer", cur: "leer" },
  { d: "19.06.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:25 Uhr", f: "17:45 Uhr", h: "9,33 h", med: "5,50 h", bau: "leer", cur: "leer" },
  { d: "25.06.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "17:05 Uhr", h: "8,17 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "26.06.2025", bm: "09:40 Uhr", m: "10:05 Uhr", bn: "leer", f: "leer", h: "0,42 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "01.07.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:45 Uhr", f: "17:40 Uhr", h: "8,83 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "03.07.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "13:00 Uhr", f: "17:40 Uhr", h: "8,75 h", med: "4,00 h", bau: "leer", cur: "leer" },
  { d: "21.07.2025", bm: "09:00 Uhr", m: "11:35 Uhr", bn: "13:00 Uhr", f: "13:45 Uhr", h: "3,33 h", med: "leer", bau: "leer", cur: "2,50 h" },
  { d: "22.07.2025", bm: "09:00 Uhr", m: "10:30 Uhr", bn: "leer", f: "leer", h: "1,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "27.07.2025", bm: "14:20 Uhr", m: "14:50 Uhr", bn: "leer", f: "leer", h: "0,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "04.08.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "9,08 h", med: "2,00 h", bau: "leer", cur: "3,00 h" },
  { d: "05.08.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:45 Uhr", f: "17:05 Uhr", h: "8,42 h", med: "6,00 h", bau: "leer", cur: "leer" },
  { d: "06.08.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "13:00 Uhr", f: "17:50 Uhr", h: "8,75 h", med: "4,00 h", bau: "leer", cur: "leer" },
  { d: "07.08.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "9,17 h", med: "2,00 h", bau: "leer", cur: "2,00 h" },
  { d: "07.08.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:45 Uhr", h: "9,17 h", med: "2,00 h", bau: "leer", cur: "2,00 h" },
  { d: "08.08.2025", bm: "08:00 Uhr", m: "12:10 Uhr", bn: "12:50 Uhr", f: "17:35 Uhr", h: "8,92 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "13.08.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:50 Uhr", f: "17:30 Uhr", h: "8,58 h", med: "4,00 h", bau: "leer", cur: "leer" },
  { d: "14.08.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,25 h", med: "3,00 h", bau: "leer", cur: "leer" },
  { d: "15.08.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:35 Uhr", f: "16:50 Uhr", h: "8,17 h", med: "3,00 h", bau: "leer", cur: "leer" },
  { d: "19.08.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:30 Uhr", f: "17:50 Uhr", h: "9,33 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "20.08.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:55 Uhr", f: "17:50 Uhr", h: "8,83 h", med: "2,50 h", bau: "leer", cur: "leer" },
  { d: "21.08.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:35 Uhr", f: "17:50 Uhr", h: "9,17 h", med: "2,50 h", bau: "leer", cur: "1,00 h" },
  { d: "22.08.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:25 Uhr", h: "8,67 h", med: "1,00 h", bau: "leer", cur: "1,00 h" },
  { d: "25.08.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:35 Uhr", f: "17:50 Uhr", h: "9,25 h", med: "0,50 h", bau: "leer", cur: "0,50 h" },
  { d: "26.08.2025", bm: "07:50 Uhr", m: "11:10 Uhr", bn: "12:30 Uhr", f: "17:10 Uhr", h: "8,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "27.08.2025", bm: "08:05 Uhr", m: "11:55 Uhr", bn: "12:40 Uhr", f: "17:05 Uhr", h: "8,25 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "28.08.2025", bm: "08:05 Uhr", m: "12:30 Uhr", bn: "13:30 Uhr", f: "17:45 Uhr", h: "8,67 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "29.08.2025", bm: "08:05 Uhr", m: "13:05 Uhr", bn: "13:25 Uhr", f: "16:50 Uhr", h: "8,42 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "01.09.2025", bm: "06:00 Uhr", m: "06:20 Uhr", bn: "leer", f: "leer", h: "0,33 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "03.09.2025", bm: "17:20 Uhr", m: "17:45 Uhr", bn: "leer", f: "leer", h: "0,42 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "08.09.2025", bm: "08:05 Uhr", m: "11:55 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,00 h", med: "2,00 h", bau: "leer", cur: "6,00 h" },
  { d: "09.09.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:05 Uhr", h: "8,33 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "10.09.2025", bm: "08:05 Uhr", m: "11:50 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "8,83 h", med: "4,00 h", bau: "leer", cur: "2,00 h" },
  { d: "11.09.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,17 h", med: "1,50 h", bau: "leer", cur: "1,00 h" },
  { d: "12.09.2025", bm: "08:20 Uhr", m: "09:25 Uhr", bn: "15:00 Uhr", f: "17:25 Uhr", h: "3,50 h", med: "leer", bau: "leer", cur: "0,50 h" },
  { d: "15.09.2025", bm: "10:00 Uhr", m: "11:15 Uhr", bn: "leer", f: "leer", h: "1,25 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "18.09.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:35 Uhr", h: "9,00 h", med: "2,00 h", bau: "leer", cur: "1,00 h" },
  { d: "19.09.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:30 Uhr", f: "16:50 Uhr", h: "8,25 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "24.09.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "13:05 Uhr", f: "17:45 Uhr", h: "8,58 h", med: "2,00 h", bau: "leer", cur: "1,00 h" },
  { d: "25.09.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:25 Uhr", f: "16:50 Uhr", h: "8,42 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "28.09.2025", bm: "13:35 Uhr", m: "15:10 Uhr", bn: "leer", f: "leer", h: "1,58 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "02.10.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:45 Uhr", f: "16:30 Uhr", h: "7,83 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "02.10.2025", bm: "17:00 Uhr", m: "19:00 Uhr", bn: "leer", f: "leer", h: "2,00 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "03.10.2025", bm: "09:00 Uhr", m: "12:05 Uhr", bn: "12:35 Uhr", f: "16:50 Uhr", h: "7,33 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "08.10.2025", bm: "09:15 Uhr", m: "09:50 Uhr", bn: "leer", f: "leer", h: "0,58 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "09.10.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:30 Uhr", f: "16:50 Uhr", h: "8,25 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "10.10.2025", bm: "08:05 Uhr", m: "11:55 Uhr", bn: "12:30 Uhr", f: "16:50 Uhr", h: "8,17 h", med: "1,50 h", bau: "leer", cur: "leer" },
  { d: "13.10.2025", bm: "09:50 Uhr", m: "10:55 Uhr", bn: "leer", f: "leer", h: "1,08 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "16.10.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,17 h", med: "leer", bau: "leer", cur: "2,00 h" },
  { d: "17.10.2025", bm: "08:05 Uhr", m: "12:20 Uhr", bn: "12:35 Uhr", f: "17:50 Uhr", h: "9,50 h", med: "3,50 h", bau: "leer", cur: "0,50 h" },
  { d: "17.10.2025", bm: "17:50 Uhr", m: "18:30 Uhr", bn: "leer", f: "leer", h: "0,67 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "23.10.2025", bm: "08:05 Uhr", m: "12:30 Uhr", bn: "13:00 Uhr", f: "16:50 Uhr", h: "8,25 h", med: "3,00 h", bau: "leer", cur: "leer" },
  { d: "24.10.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "16:50 Uhr", h: "8,25 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "28.10.2025", bm: "09:00 Uhr", m: "10:00 Uhr", bn: "leer", f: "leer", h: "1,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "29.10.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:35 Uhr", f: "17:00 Uhr", h: "8,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "30.10.2025", bm: "08:45 Uhr", m: "12:10 Uhr", bn: "12:40 Uhr", f: "17:55 Uhr", h: "8,67 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "01.11.2025", bm: "14:00 Uhr", m: "14:45 Uhr", bn: "leer", f: "leer", h: "0,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "02.11.2025", bm: "15:45 Uhr", m: "18:20 Uhr", bn: "leer", f: "leer", h: "2,58 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "05.11.2025", bm: "07:45 Uhr", m: "12:10 Uhr", bn: "13:00 Uhr", f: "17:45 Uhr", h: "9,17 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "06.11.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "16:50 Uhr", h: "8,17 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "07.11.2025", bm: "10:10 Uhr", m: "11:25 Uhr", bn: "12:15 Uhr", f: "15:45 Uhr", h: "4,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "10.11.2025", bm: "09:20 Uhr", m: "10:30 Uhr", bn: "leer", f: "leer", h: "1,17 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "12.11.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,17 h", med: "2,00 h", bau: "leer", cur: "2,00 h" },
  { d: "13.11.2025", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "13:05 Uhr", f: "19:15 Uhr", h: "10,25 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "14.11.2025", bm: "13:35 Uhr", m: "15:30 Uhr", bn: "leer", f: "leer", h: "1,92 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "15.11.2025", bm: "17:30 Uhr", m: "18:00 Uhr", bn: "leer", f: "leer", h: "0,50 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "17.11.2025", bm: "14:50 Uhr", m: "16:15 Uhr", bn: "leer", f: "leer", h: "1,42 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "19.11.2025", bm: "09:30 Uhr", m: "10:10 Uhr", bn: "leer", f: "leer", h: "0,67 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "20.11.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:30 Uhr", f: "17:50 Uhr", h: "9,25 h", med: "1,00 h", bau: "leer", cur: "1,50 h" },
  { d: "21.11.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "13:00 Uhr", f: "21:30 Uhr", h: "12,42 h", med: "2,00 h", bau: "leer", cur: "leer" },
  { d: "26.11.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "9,08 h", med: "1,00 h", bau: "leer", cur: "leer" },
  { d: "27.11.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:45 Uhr", h: "9,00 h", med: "3,00 h", bau: "leer", cur: "leer" },
  { d: "28.11.2025", bm: "08:10 Uhr", m: "09:40 Uhr", bn: "leer", f: "leer", h: "1,50 h", med: "1,25 h", bau: "leer", cur: "0,25 h" },
  { d: "03.12.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "17:50 Uhr", h: "9,00 h", med: "2,00 h", bau: "leer", cur: "0,50 h" },
  { d: "04.12.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:00 Uhr", h: "8,33 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "08.12.2025", bm: "15:15 Uhr", m: "15:50 Uhr", bn: "leer", f: "leer", h: "0,58 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "11.12.2025", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:30 Uhr", f: "17:20 Uhr", h: "8,83 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "12.12.2025", bm: "09:10 Uhr", m: "12:10 Uhr", bn: "12:45 Uhr", f: "17:00 Uhr", h: "7,25 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "17.12.2025", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "9,00 h", med: "leer", bau: "leer", cur: "2,50 h" },
  { d: "18.12.2025", bm: "08:10 Uhr", m: "12:00 Uhr", bn: "12:45 Uhr", f: "17:00 Uhr", h: "8,08 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "23.12.2025", bm: "11:10 Uhr", m: "13:30 Uhr", bn: "leer", f: "leer", h: "2,33 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "24.12.2025", bm: "10:00 Uhr", m: "15:10 Uhr", bn: "leer", f: "leer", h: "5,17 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "29.12.2025", bm: "10:00 Uhr", m: "11:45 Uhr", bn: "leer", f: "leer", h: "1,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "30.12.2025", bm: "18:30 Uhr", m: "20:15 Uhr", bn: "leer", f: "leer", h: "1,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "05.01.2026", bm: "09:15 Uhr", m: "10:30 Uhr", bn: "leer", f: "leer", h: "1,25 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "07.01.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,17 h", med: "leer", bau: "leer", cur: "1,00 h" },
  { d: "08.01.2026", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:35 Uhr", f: "17:50 Uhr", h: "9,33 h", med: "leer", bau: "leer", cur: "0,50 h" },
  { d: "09.01.2026", bm: "10:10 Uhr", m: "11:05 Uhr", bn: "14:35 Uhr", f: "16:10 Uhr", h: "2,50 h", med: "leer", bau: "leer", cur: "0,50 h" },
  { d: "12.01.2026", bm: "09:00 Uhr", m: "11:30 Uhr", bn: "14:30 Uhr", f: "15:00 Uhr", h: "3,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "15.01.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "9,08 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "16.01.2026", bm: "08:05 Uhr", m: "12:10 Uhr", bn: "12:50 Uhr", f: "17:10 Uhr", h: "8,42 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "21.01.2026", bm: "09:45 Uhr", m: "11:10 Uhr", bn: "leer", f: "leer", h: "1,42 h", med: "0.75", bau: "leer", cur: "leer" },
  { d: "22.01.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "17:50 Uhr", h: "9,00 h", med: "leer", bau: "leer", cur: "1,50 h" },
  { d: "23.01.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "16:50 Uhr", h: "8,00 h", med: "1,00 h", bau: "leer", cur: "0,50 h" },
  { d: "29.01.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:40 Uhr", f: "17:00 Uhr", h: "8,33 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "30.01.2026", bm: "09:30 Uhr", m: "12:05 Uhr", bn: "12:35 Uhr", f: "17:00 Uhr", h: "7,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "04.02.2026", bm: "07:50 Uhr", m: "11:55 Uhr", bn: "13:00 Uhr", f: "17:50 Uhr", h: "8,92 h", med: "1,00 h", bau: "leer", cur: "1,00 h" },
  { d: "05.02.2026", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:40 Uhr", f: "17:50 Uhr", h: "9,08 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "11.02.2026", bm: "08:05 Uhr", m: "12:00 Uhr", bn: "12:30 Uhr", f: "15:50 Uhr", h: "7,25 h", med: "0,50 h", bau: "leer", cur: "leer" },
  { d: "11.02.2026", bm: "19:00 Uhr", m: "20:20 Uhr", bn: "leer", f: "leer", h: "1,33 h", med: "leer", bau: "leer", cur: "1,00 h" },
  { d: "12.02.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:50 Uhr", f: "17:50 Uhr", h: "9,00 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "16.02.2026", bm: "08:15 Uhr", m: "09:00 Uhr", bn: "leer", f: "leer", h: "0,75 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "19.02.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "9,08 h", med: "leer", bau: "leer", cur: "leer" },
  { d: "20.02.2026", bm: "08:05 Uhr", m: "12:05 Uhr", bn: "12:45 Uhr", f: "17:50 Uhr", h: "9,08 h", med: "leer", bau: "leer", cur: "leer" },
];

export const INITIAL_IMPORT_DATA: TimeEntry[] = rawData.map((item, index) => {
  const total = parseImportHours(item.h);
  const med = parseImportHours(item.med);
  const bau = parseImportHours(item.bau);
  const cur = parseImportHours(item.cur);
  const main = Math.max(0, total - (med + bau + cur));

  return {
    id: `import-${index}`,
    date: parseImportDate(item.d),
    startM: parseImportTime(item.bm),
    lunch: parseImportTime(item.m),
    startN: parseImportTime(item.bn),
    end: parseImportTime(item.f) || parseImportTime(item.m),
    note: '',
    totalHours: total,
    splits: { med, bau, cursum: cur, talentzio: main },
    comments: { med: '', bau: '', cursum: '', talentzio: '' },
    isLocked: false,
  };
});
