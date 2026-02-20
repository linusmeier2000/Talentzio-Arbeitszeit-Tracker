
export interface CompanySplit {
  med: number;
  bau: number;
  cursum: number;
  talentzio: number; // Remainder
}

export interface CompanyComments {
  med: string;
  bau: string;
  cursum: string;
  talentzio: string;
}

export interface TimeEntry {
  id: string;
  date: string; // ISO date string
  startM: string; // HH:mm
  lunch: string; // HH:mm
  startN: string; // HH:mm (optional, can be empty)
  end: string; // HH:mm
  note: string;
  splits: CompanySplit;
  comments: CompanyComments;
  totalHours: number;
  isLocked: boolean;
}

export interface HourlyWage {
  rate: number;
  validFrom: string;
}

export interface UserSettings {
  userName: string;
  wages: HourlyWage[];
  roundingMinutes: number; // e.g., 5
  defaultStartM: string;
  defaultLunch: string;
  defaultStartN: string;
  defaultEnd: string;
  lastExportDate: string | null;
  darkMode: boolean;
}
