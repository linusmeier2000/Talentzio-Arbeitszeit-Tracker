
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Calendar, 
  Info, 
  AlertCircle, 
  Lightbulb,
  CheckSquare,
  Square
} from 'lucide-react';
import { Notification } from '../types';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsDone: (id: string) => void;
  onPlanNextWeek: (days: string[], notificationId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onMarkAsDone,
  onPlanNextWeek
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

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

  const activeNotifications = notifications.filter(n => !n.isRead);

  if (activeNotifications.length === 0) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
          <Bell className="w-6 h-6" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keine neuen Meldungen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence mode="popLayout">
        {activeNotifications.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-2xl border shadow-sm relative group transition-all ${
              n.type === 'planning' ? 'bg-brand-50 border-brand-100' :
              n.type === 'alert' ? 'bg-red-50 border-red-100' :
              n.type === 'fact' ? 'bg-emerald-50 border-emerald-100' :
              'bg-white border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg ${
                  n.type === 'planning' ? 'bg-brand-500 text-white' :
                  n.type === 'alert' ? 'bg-red-500 text-white' :
                  n.type === 'fact' ? 'bg-emerald-500 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {n.type === 'planning' && <Calendar className="w-3 h-3" />}
                  {n.type === 'alert' && <AlertCircle className="w-3 h-3" />}
                  {n.type === 'fact' && <Lightbulb className="w-3 h-3" />}
                  {n.type === 'info' && <Info className="w-3 h-3" />}
                  {n.type === 'draft-ready' && <CheckSquare className="w-3 h-3" />}
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">{n.title}</h4>
              </div>
              <button 
                onClick={() => onMarkAsDone(n.id)}
                className="p-1 text-gray-300 hover:text-emerald-500 transition-colors"
                title="Als erledigt markieren"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-gray-600 leading-relaxed mb-3">
              {n.message}
            </p>

            {n.type === 'planning' && (
              <div className="space-y-3 mt-4 pt-4 border-t border-brand-100">
                {(!n.data?.isPlanned || editingId === n.id) ? (
                  <>
                    <div className="grid grid-cols-1 gap-2">
                      {weekdays.map(day => (
                        <button 
                          key={day.id}
                          onClick={() => toggleDay(day.id)}
                          className="flex items-center space-x-3 p-2 hover:bg-white/50 rounded-xl transition-colors"
                        >
                          {selectedDays.includes(day.id) ? (
                            <CheckSquare className="w-4 h-4 text-brand-500" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">{day.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {editingId === n.id && (
                        <button 
                          onClick={() => setEditingId(null)}
                          className="flex-1 bg-gray-100 text-gray-500 font-black py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                        >
                          Abbrechen
                        </button>
                      )}
                      <button 
                        disabled={selectedDays.length === 0}
                        onClick={() => {
                          onPlanNextWeek(selectedDays, n.id);
                          setEditingId(null);
                        }}
                        className="flex-[2] bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 text-white font-black py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20"
                      >
                        Planung bestätigen
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {weekdays.filter(d => n.data?.plannedDays?.includes(d.id)).map(d => (
                        <span key={d.id} className="px-2 py-1 bg-brand-100 text-brand-700 text-[9px] font-black uppercase rounded-lg">
                          {d.label}
                        </span>
                      ))}
                    </div>
                    <button 
                      onClick={() => {
                        setEditingId(n.id);
                        setSelectedDays(n.data?.plannedDays || []);
                      }}
                      className="w-full bg-white border border-brand-200 text-brand-500 hover:bg-brand-50 font-black py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                    >
                      Wochenplanung anpassen
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
