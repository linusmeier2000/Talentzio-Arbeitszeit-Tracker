
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';

interface PlanningWidgetProps {
  onPlan: (days: string[]) => void;
  initialDays: string[];
  variant?: 'default' | 'embedded';
}

const PlanningWidget: React.FC<PlanningWidgetProps> = ({ onPlan, initialDays, variant = 'default' }) => {
  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);
  
  useEffect(() => {
    setSelectedDays(initialDays);
  }, [initialDays]);
  
  const weekdays = [
    { id: '1', label: 'Montag' },
    { id: '2', label: 'Dienstag' },
    { id: '3', label: 'Mittwoch' },
    { id: '4', label: 'Donnerstag' },
    { id: '5', label: 'Freitag' },
  ];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const isEmbedded = variant === 'embedded';

  return (
    <motion.div 
      initial={isEmbedded ? {} : { opacity: 0, y: 20 }}
      animate={isEmbedded ? {} : { opacity: 1, y: 0 }}
      className={isEmbedded 
        ? "text-gray-900" 
        : "bg-brand-500 p-6 md:p-8 rounded-2xl md:rounded-[3rem] text-white shadow-xl shadow-brand-100"
      }
    >
      {!isEmbedded && (
        <>
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Wochenplanung</h3>
              <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Nächste Woche vorbereiten</p>
            </div>
          </div>
          
          <p className="text-sm font-medium mb-6 leading-relaxed">
            Weisst du schon, an welchen Tagen du nächste Woche arbeiten wirst? Wähle die Tage aus, um Entwürfe zu erstellen oder zu aktualisieren.
          </p>
        </>
      )}

      <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-2 ${isEmbedded ? 'mb-4' : 'mb-6'}`}>
        {weekdays.map(day => (
          <button 
            key={day.id}
            onClick={() => toggleDay(day.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${
              selectedDays.includes(day.id) 
                ? (isEmbedded ? 'bg-brand-500 text-white border-brand-500 shadow-lg' : 'bg-white text-brand-600 border-white shadow-lg')
                : (isEmbedded ? 'bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100' : 'bg-brand-600/30 border-brand-400/30 text-white hover:bg-brand-600/50')
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-widest">{day.label.substring(0, 2)}</span>
            <span className="text-[8px] font-bold opacity-60 mt-1">{day.label}</span>
          </button>
        ))}
      </div>

      <button 
        disabled={selectedDays.length === 0}
        onClick={() => onPlan(selectedDays)}
        className={`w-full font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] ${
          isEmbedded 
            ? 'bg-brand-500 text-white shadow-brand-200' 
            : 'bg-white text-brand-600 shadow-black/10'
        }`}
      >
        Planung bestätigen
      </button>
    </motion.div>
  );
};

export default PlanningWidget;
