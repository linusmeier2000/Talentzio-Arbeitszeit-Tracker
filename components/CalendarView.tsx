
import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { TimeEntry } from '../types';
import { getMonthName } from '../utils';

interface CalendarViewProps {
  entries: TimeEntry[];
  viewMonth: number;
  viewYear: number;
  onMonthChange: (month: number, year: number) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ entries, viewMonth, viewYear, onMonthChange }) => {
  const daysInMonth = useMemo(() => new Date(viewYear, viewMonth + 1, 0).getDate(), [viewMonth, viewYear]);
  const firstDayOfMonth = useMemo(() => {
    const day = new Date(viewYear, viewMonth, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to start with Monday (0=Mon, 6=Sun)
  }, [viewMonth, viewYear]);

  const monthEntries = useMemo(() => {
    return entries.filter(e => {
      // Parse YYYY-MM-DD manually to avoid timezone shifts
      const [year, month] = e.date.split('-').map(Number);
      return (month - 1) === viewMonth && year === viewYear;
    });
  }, [entries, viewMonth, viewYear]);

  const hoursByDay = useMemo(() => {
    const map: Record<number, { total: number, isDraft: boolean }> = {};
    monthEntries.forEach(e => {
      // Parse YYYY-MM-DD manually
      const day = parseInt(e.date.split('-')[2]);
      const current = map[day] || { total: 0, isDraft: true };
      map[day] = {
        total: current.total + e.totalHours,
        isDraft: current.isDraft && !!e.isDraft
      };
    });
    return map;
  }, [monthEntries]);

  const maxHours = useMemo(() => {
    const values = Object.values(hoursByDay).map((v: any) => v.total);
    return values.length > 0 ? Math.max(...values) : 10;
  }, [hoursByDay]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      onMonthChange(11, viewYear - 1);
    } else {
      onMonthChange(viewMonth - 1, viewYear);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      onMonthChange(0, viewYear + 1);
    } else {
      onMonthChange(viewMonth + 1, viewYear);
    }
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl md:rounded-[3rem] shadow-2xl border border-white/5 relative overflow-hidden group">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
              <CalendarIcon className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight">{getMonthName(viewMonth)} {viewYear}</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Aktivitäts-Kalender</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-white/5"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors border border-white/5"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-8 md:gap-y-10 text-center">
          {weekdays.map(wd => (
            <div key={wd} className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {wd}
            </div>
          ))}
          
          {blanks.map(b => <div key={`blank-${b}`} />)}
          
          {days.map(day => {
            const dayData = hoursByDay[day] || { total: 0, isDraft: false };
            const hours = dayData.total;
            const isDraft = dayData.isDraft;
            
            // Scale circle size based on hours. Max size can exceed 100% to allow overlapping like in the inspiration image.
            // Using a square root scale for area representation
            const sizePercent = hours > 0 ? Math.max(40, Math.sqrt(hours / maxHours) * 160) : 0;
            
            return (
              <div key={day} className="relative flex items-center justify-center h-10 md:h-14 group/day">
                {hours > 0 && (
                  <div 
                    className={`absolute rounded-full border transition-all duration-500 group-hover/day:scale-110 aspect-square ${
                      isDraft 
                        ? 'bg-amber-500/30 border-amber-400 border-2 border-dashed animate-pulse' 
                        : 'bg-brand-500/40 border-brand-400/30 group-hover/day:bg-brand-500/60'
                    }`}
                    style={{ 
                      width: `${sizePercent}%`,
                    }}
                  />
                )}
                <span className={`relative z-10 text-xs md:text-sm font-black transition-colors ${hours > 0 ? (isDraft ? 'text-amber-200' : 'text-white') : 'text-slate-600'}`}>
                  {day}
                </span>
                
                {/* Tooltip */}
                {hours > 0 && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/day:block z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white text-slate-900 px-3 py-1.5 rounded-xl shadow-xl text-[10px] font-black whitespace-nowrap border border-slate-100 flex items-center space-x-1">
                      <span>{hours.toFixed(2)} h</span>
                      {!!isDraft && <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded">ENTWURF</span>}
                    </div>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white mx-auto" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
