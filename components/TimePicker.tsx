
import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hours, setHours] = useState(value ? value.split(':')[0] : '08');
  const [minutes, setMinutes] = useState(value ? value.split(':')[1] : '00');

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHours(h);
      setMinutes(m);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const formattedTime = `${newHours.padStart(2, '0')}:${newMinutes.padStart(2, '0')}`;
    onChange(formattedTime);
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] focus-within:ring-4 focus-within:ring-brand-50 dark:focus-within:ring-brand-500/20 outline-none flex items-center justify-between cursor-pointer shadow-sm transition-all hover:border-brand-200 dark:hover:border-brand-500/50"
      >
        <div className="flex flex-col">
          {label && <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</span>}
          <span className={`text-xl font-black ${!value ? 'text-gray-300 dark:text-slate-700' : 'text-gray-900 dark:text-white'}`}>
            {value || placeholder || '--:--'}
          </span>
        </div>
        <Clock className={`w-5 h-5 transition-colors ${isOpen ? 'text-brand-500' : 'text-gray-300 dark:text-slate-700'}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex gap-4">
            {/* Hours Column */}
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Stunden</p>
              <div className="h-48 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                {hourOptions.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setHours(h);
                      handleTimeChange(h, minutes);
                    }}
                    className={`w-full py-2 rounded-xl text-sm font-black transition-all ${hours === h ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">Minuten</p>
              <div className="h-48 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                {minuteOptions.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMinutes(m);
                      handleTimeChange(hours, m);
                      setIsOpen(false);
                    }}
                    className={`w-full py-2 rounded-xl text-sm font-black transition-all ${minutes === m ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-50 dark:border-slate-800">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-gray-900 dark:bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black dark:hover:bg-brand-600 transition-colors"
            >
              Fertig
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
