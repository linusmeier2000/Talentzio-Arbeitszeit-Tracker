
import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  suggestions?: string[];
  roundingMode?: 'up' | 'down';
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, placeholder, suggestions = [], roundingMode = 'down' }) => {
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

  const defaultPresets = ['07:00', '08:00', '09:00', '12:00', '13:00', '16:00', '17:00', '18:00'];
  const displayPresets = suggestions.length > 0 ? suggestions : defaultPresets;

  const handleSetNow = () => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    
    let finalH = h;
    let finalM = 0;

    if (roundingMode === 'down') {
      // Immer abrunden auf 5 Min
      finalM = Math.floor(m / 5) * 5;
    } else {
      // Immer aufrunden auf 5 Min
      finalM = Math.ceil(m / 5) * 5;
      if (finalM === 60) {
        finalM = 0;
        finalH = (h + 1) % 24;
      }
    }

    const formattedH = finalH.toString().padStart(2, '0');
    const formattedM = finalM.toString().padStart(2, '0');
    onChange(`${formattedH}:${formattedM}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-5 bg-white border border-gray-100 rounded-[1.5rem] focus-within:ring-4 focus-within:ring-brand-50 outline-none flex items-center justify-between cursor-pointer shadow-sm transition-all hover:border-brand-200"
      >
        <div className="flex flex-col">
          {label && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</span>}
          <span className={`text-xl font-black ${!value ? 'text-gray-300' : 'text-gray-900'}`}>
            {value || placeholder || '--:--'}
          </span>
        </div>
        <Clock className={`w-5 h-5 transition-colors ${isOpen ? 'text-brand-500' : 'text-gray-300'}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-3 w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Schnellauswahl</p>
              <button 
                type="button" 
                onClick={handleSetNow}
                className="text-[10px] font-black text-brand-600 hover:text-brand-700 uppercase tracking-widest"
              >
                Jetzt
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {displayPresets.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    onChange(p);
                    setIsOpen(false);
                  }}
                  className={`py-2 rounded-lg text-[10px] font-black transition-all border ${value === p ? 'bg-brand-500 text-white border-brand-500' : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-brand-200'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {/* Hours Column */}
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Stunden</p>
              <div className="h-48 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                {hourOptions.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setHours(h);
                      handleTimeChange(h, minutes);
                    }}
                    className={`w-full py-2 rounded-xl text-sm font-black transition-all ${hours === h ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div className="flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Minuten</p>
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
                    className={`w-full py-2 rounded-xl text-sm font-black transition-all ${minutes === m ? 'bg-brand-500 text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-50">
            <button 
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-colors"
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
