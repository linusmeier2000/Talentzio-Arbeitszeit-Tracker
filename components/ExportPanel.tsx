
import React, { useState, useMemo, useEffect } from 'react';
import { TimeEntry, UserSettings } from '../types';
import { formatDate, getWeekday, getMonthName } from '../utils';
import { Calendar, Lock, Unlock, FileSpreadsheet, FileWarning, Printer, Download } from 'lucide-react';

interface ExportPanelProps {
  entries: TimeEntry[];
  settings: UserSettings;
  onToggleLock: (startDate: string, endDate: string, lock: boolean) => void;
  onUpdateExportDate: (date: string) => void;
}

const ExportPanel: React.FC<ExportPanelProps> = ({ entries, settings, onToggleLock, onUpdateExportDate }) => {
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const firstDay = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  
  const [overrideMonth, setOverrideMonth] = useState<number | null>(null);
  const [overrideYear, setOverrideYear] = useState<number | null>(null);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => e.date >= startDate && e.date <= endDate)
                  .sort((a, b) => a.date.localeCompare(b.date));
  }, [entries, startDate, endDate]);

  // Berechnet den dominanten Monat und das Jahr für den Titel
  const dominantPeriod = useMemo(() => {
    if (filteredEntries.length === 0) return { month: lastMonthDate.getMonth(), year: lastMonthDate.getFullYear() };
    
    const months: Record<number, number> = {};
    const years: Record<number, number> = {};
    
    filteredEntries.forEach(e => {
      const d = new Date(e.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      months[m] = (months[m] || 0) + 1;
      years[y] = (years[y] || 0) + 1;
    });
    
    const domMonth = Object.entries(months).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    const domYear = Object.entries(years).reduce((a, b) => b[1] > a[1] ? b : a)[0];
    
    return {
      month: parseInt(domMonth),
      year: parseInt(domYear)
    };
  }, [filteredEntries]);

  // Wenn sich der Zeitraum ändert, passen wir die Standardauswahl an, sofern der User nichts manuell gewählt hat
  useEffect(() => {
    if (overrideMonth === null) setOverrideMonth(dominantPeriod.month);
    if (overrideYear === null) setOverrideYear(dominantPeriod.year);
  }, [dominantPeriod]);

  const displayMonth = overrideMonth ?? dominantPeriod.month;
  const displayYear = overrideYear ?? dominantPeriod.year;

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, curr) => ({
      total: acc.total + curr.totalHours,
      med: acc.med + curr.splits.med,
      bau: acc.bau + curr.splits.bau,
      cursum: acc.cursum + curr.splits.cursum,
    }), { total: 0, med: 0, bau: 0, cursum: 0 });
  }, [filteredEntries]);

  const allEntriesLocked = useMemo(() => {
    if (filteredEntries.length === 0) return false;
    return filteredEntries.every(e => e.isLocked);
  }, [filteredEntries]);

  const handleExportCSV = () => {
    if (filteredEntries.length === 0) return;
    const headers = ['Datum', 'Tag', 'B. M', 'Pause', 'B. N', 'Ende', 'Total', 'Med AG', 'Bau AG', 'Cursum'];
    const rows = filteredEntries.map(e => [
      formatDate(e.date), getWeekday(e.date).substring(0, 2), e.startM, e.lunch, e.startN || '-', e.end,
      e.totalHours.toFixed(2).replace('.', ','), e.splits.med.toFixed(2).replace('.', ','),
      e.splits.bau.toFixed(2).replace('.', ','), e.splits.cursum.toFixed(2).replace('.', ',')
    ]);
    rows.push(['TOTAL', '', '', '', '', '', totals.total.toFixed(2).replace('.', ','), totals.med.toFixed(2).replace('.', ','), totals.bau.toFixed(2).replace('.', ','), totals.cursum.toFixed(2).replace('.', ',')]);
    const csvContent = "\ufeff" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Arbeitszeit_${getMonthName(displayMonth)}_${displayYear}_${settings.userName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onUpdateExportDate(endDate);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Steuerungs-Panel - no-print */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm space-y-8 no-print">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-xl"><Calendar className="w-5 h-5 text-brand-500" /></div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Export-Center</h3>
          </div>
          
          {filteredEntries.length > 0 && (
            <button 
              onClick={() => onToggleLock(startDate, endDate, !allEntriesLocked)}
              className={`flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                allEntriesLocked ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
              }`}
            >
              {allEntriesLocked ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />}
              {allEntriesLocked ? 'Zeitraum entsperren' : 'Abschließen'}
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span> Zeitraum wählen
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase ml-1">Von</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-brand-500 dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase ml-1">Bis</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-brand-500 dark:text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 bg-brand-500 rounded-full mr-2"></span> Titel-Konfiguration
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase ml-1">Monat</label>
                <select value={displayMonth} onChange={(e) => setOverrideMonth(parseInt(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-brand-500 appearance-none dark:text-white">
                  {months.map(m => <option key={m} value={m} className="dark:bg-slate-900">{getMonthName(m)}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-300 dark:text-slate-600 uppercase ml-1">Jahr</label>
                <select value={displayYear} onChange={(e) => setOverrideYear(parseInt(e.target.value))} className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-brand-500 appearance-none dark:text-white">
                  {years.map(y => <option key={y} value={y} className="dark:bg-slate-900">{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 dark:bg-slate-800 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="text-center md:text-left z-10">
            <p className="text-xl font-black text-white">{filteredEntries.length} Tage für PDF bereit</p>
            <p className="text-xs text-brand-400 font-medium tracking-tight mt-1 flex items-center justify-center md:justify-start">
              <Printer className="w-3 h-3 mr-2" /> PDF via <kbd className="bg-slate-800 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-700 dark:border-slate-600 text-slate-200 mx-1">Ctrl + P</kbd> speichern
            </p>
          </div>
          
          <button 
            onClick={handleExportCSV} 
            disabled={filteredEntries.length === 0} 
            className="z-10 text-[10px] text-slate-500 hover:text-white flex items-center transition-colors uppercase font-black tracking-widest"
          >
            <Download className="w-3 h-3 mr-2" /> CSV Datenexport
          </button>
        </div>
      </div>

      {/* Das Dokument (Print-optimiert) */}
      <div id="print-area" className="bg-white dark:bg-slate-900 rounded-[2rem] border dark:border-slate-800 shadow-sm overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
        <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-b dark:border-slate-800 no-print flex justify-between items-center text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">
          Druckvorschau
        </div>

        {filteredEntries.length > 0 ? (
          <div className="p-8 md:p-16 bg-white printable-content">
            {/* Header des Dokuments */}
            <div className="mb-10 border-b-2 border-slate-900 pb-8">
               <div className="relative">
                 <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">
                    Arbeitszeit {getMonthName(displayMonth)} {displayYear}
                 </h1>
                 <p className="text-base text-gray-500 font-bold mt-2 uppercase tracking-[0.2em]">{settings.userName}</p>
                 <div className="absolute top-0 right-0 h-full flex flex-col justify-center items-end text-right">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none">Dokument erstellt am</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{new Date().toLocaleDateString('de-CH')}</p>
                 </div>
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 text-slate-900 font-black uppercase tracking-tighter">
                    <th className="px-2 py-4 text-left">Datum</th>
                    <th className="px-1 py-4 text-left">Tag</th>
                    <th className="px-1 py-4 text-center">B. M.</th>
                    <th className="px-1 py-4 text-center">Pause</th>
                    <th className="px-1 py-4 text-center">B. N.</th>
                    <th className="px-1 py-4 text-center">Ende</th>
                    <th className="px-2 py-4 text-right bg-brand-50/50 border-l border-brand-100">Total</th>
                    <th className="px-2 py-4 text-center border-l border-slate-200">Med</th>
                    <th className="px-2 py-4 text-center">Bau</th>
                    <th className="px-2 py-4 text-center">Cur.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map((e, idx) => (
                    <tr key={e.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-2 py-2.5 font-bold text-slate-900">{formatDate(e.date)}</td>
                      <td className="px-1 py-2.5 text-gray-500 font-medium">{getWeekday(e.date).substring(0,2)}</td>
                      <td className="px-1 py-2.5 text-center text-gray-400">{e.startM}</td>
                      <td className="px-1 py-2.5 text-center text-gray-400">{e.lunch}</td>
                      <td className="px-1 py-2.5 text-center text-gray-400">{e.startN || '—'}</td>
                      <td className="px-1 py-2.5 text-center text-gray-400">{e.end}</td>
                      <td className="px-2 py-2.5 text-right font-black bg-brand-50/20 text-brand-700 border-l border-brand-100">{e.totalHours.toFixed(2)}</td>
                      <td className="px-2 py-2.5 text-center font-bold text-gray-700 border-l border-slate-100">{e.splits.med > 0 ? e.splits.med.toFixed(2) : ''}</td>
                      <td className="px-2 py-2.5 text-center font-bold text-gray-700">{e.splits.bau > 0 ? e.splits.bau.toFixed(2) : ''}</td>
                      <td className="px-2 py-2.5 text-center font-bold text-gray-700">{e.splits.cursum > 0 ? e.splits.cursum.toFixed(2) : ''}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-black border-t-2 border-white">
                    <td colSpan={6} className="px-2 py-6 text-right text-[10px] uppercase tracking-widest text-slate-400">Summe Stunden</td>
                    <td className="px-2 py-6 text-right text-xl text-brand-400 border-l border-slate-700">{totals.total.toFixed(2)}</td>
                    <td className="px-2 py-6 text-center border-l border-slate-700 bg-slate-800/50">{totals.med.toFixed(2)}</td>
                    <td className="px-2 py-6 text-center bg-slate-800/50">{totals.bau.toFixed(2)}</td>
                    <td className="px-2 py-6 text-center bg-slate-800/50">{totals.cursum.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-20 pt-8 border-t border-gray-100 hidden print:block text-center">
              <p className="text-[8px] text-gray-300 uppercase tracking-[0.5em]">Dieses Dokument wurde digital generiert — Linus Meier — Arbeitszeit Tracker</p>
            </div>
          </div>
        ) : (
          <div className="p-24 text-center space-y-4">
             <div className="bg-orange-50 dark:bg-orange-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
               <FileWarning className="w-10 h-10 text-orange-400" />
             </div>
             <p className="text-xl font-black text-gray-900 dark:text-white">Keine Einträge verfügbar</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          @page { size: portrait; margin: 1.2cm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body { background: white !important; overflow: visible !important; height: auto !important; }
          #root { display: block !important; padding: 0 !important; margin: 0 !important; }
          .no-print, aside, nav, header, button, .z-10 { display: none !important; }
          main { display: block !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
          #print-area { display: block !important; width: 100% !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; }
          .printable-content { padding: 0 !important; }
          table { width: 100% !important; table-layout: fixed !important; }
          tr { page-break-inside: avoid !important; }
          .bg-brand-50 { background-color: #f0f7fb !important; }
          .bg-brand-20 { background-color: #f0f7fb !important; }
          .bg-slate-900 { background-color: #0f172a !important; }
          .bg-slate-100 { background-color: #f1f5f9 !important; }
          .text-brand-400 { color: #389fd4 !important; }
          .text-brand-700 { color: #025283 !important; }
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;
