
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
import { Notification, TimeEntry } from '../types';
import PlanningWidget from './PlanningWidget';
import { getLocalDateString } from '../utils';

interface NotificationCenterProps {
  notifications: Notification[];
  entries: TimeEntry[];
  onMarkAsDone: (id: string) => void;
  onPlanNextWeek: (days: string[], notificationId: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  entries,
  onMarkAsDone,
  onPlanNextWeek
}) => {
  // De-duplicate notifications by ID to be safe
  const activeNotifications = notifications
    .filter(n => !n.isRead)
    .filter((n, index, self) => index === self.findIndex((t) => t.id === n.id));

  const getPlannedDaysForNextWeek = () => {
    const now = new Date();
    const nextMonday = new Date();
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    
    const plannedDays: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i);
      const dStr = getLocalDateString(d);
      if (entries.some(e => e.date === dStr)) {
        plannedDays.push((i + 1).toString());
      }
    }
    return plannedDays;
  };

  if (activeNotifications.length === 0) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
          <Bell className="w-6 h-6" />
        </div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Keine neuen Meldungen</p>
        <p className="text-[8px] text-gray-300 font-medium">Alle anstehenden Aufgaben und Hinweise wurden erledigt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pr-2">
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
              {n.type !== 'planning' && (
                <button 
                  onClick={() => onMarkAsDone(n.id)}
                  className="p-1 text-gray-300 hover:text-emerald-500 transition-colors"
                  title="Als erledigt markieren"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-xs font-medium text-gray-600 leading-relaxed mb-3">
              {n.message}
            </p>

            {n.type === 'planning' && (
              <div className="mt-4 pt-4 border-t border-brand-100">
                <PlanningWidget 
                  variant="embedded"
                  initialDays={getPlannedDaysForNextWeek()} 
                  onPlan={(days) => onPlanNextWeek(days, n.id)} 
                />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
