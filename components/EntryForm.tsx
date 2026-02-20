
import React, { useState, useEffect, useMemo } from 'react';
import { TimeEntry, CompanySplit, CompanyComments } from '../types';
import TimePicker from './TimePicker';
import { 
  DEFAULT_SETTINGS, 
  COMPANIES 
} from '../constants';
import { 
  calculateTotalHours, 
  getWeekday, 
  roundTo, 
} from '../utils';
import { generateWorkComment } from '../services/geminiService';
import { 
  Sparkles, Save, X, Trash2, Loader2, Info, 
  AlertTriangle, ChevronRight, ChevronLeft, Calendar, 
  Clock, Briefcase, FileText, CheckCircle2 
} from 'lucide-react';

interface EntryFormProps {
  initialData?: TimeEntry;
  entries: TimeEntry[];
  onSave: (entry: TimeEntry) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

type Step = 'basis' | 'times' | 'splits' | 'final';

const EntryForm: React.FC<EntryFormProps> = ({ initialData, entries, onSave, onCancel, onDelete }) => {
  const [currentStep, setCurrentStep] = useState<Step>('basis');
  const [formData, setFormData] = useState<Partial<TimeEntry>>(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      startM: DEFAULT_SETTINGS.defaultStartM,
      lunch: DEFAULT_SETTINGS.defaultLunch,
      startN: DEFAULT_SETTINGS.defaultStartN,
      end: DEFAULT_SETTINGS.defaultEnd,
      note: '',
      splits: { med: 0, bau: 0, cursum: 0, talentzio: 0 },
      comments: { med: '', bau: '', cursum: '', talentzio: '' },
      totalHours: 0,
      isLocked: false,
    }
  );

  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  const totalDayHours = calculateTotalHours(
    formData.startM || '',
    formData.lunch || '',
    formData.startN || '',
    formData.end || ''
  );

  const roundedTotal = roundTo(totalDayHours, DEFAULT_SETTINGS.roundingMinutes);

  useEffect(() => {
    const splitSum = (formData.splits?.med || 0) + (formData.splits?.bau || 0) + (formData.splits?.cursum || 0);
    const remainder = Math.max(0, roundedTotal - splitSum);
    
    setFormData(prev => ({
      ...prev,
      totalHours: roundedTotal,
      splits: {
        ...prev.splits!,
        talentzio: remainder
      }
    }));
  }, [roundedTotal, formData.splits?.med, formData.splits?.bau, formData.splits?.cursum]);

  const handleChange = (field: keyof TimeEntry, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSplitChange = (company: keyof CompanySplit, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      splits: {
        ...prev.splits!,
        [company]: numValue
      }
    }));
  };

  const handleCommentChange = (company: keyof CompanyComments, value: string) => {
    setFormData(prev => ({
      ...prev,
      comments: {
        ...prev.comments!,
        [company]: value
      }
    }));
  };

  const triggerAiComment = async (company: keyof CompanyComments, name: string) => {
    const keywords = formData.comments?.[company] || '';
    if (!keywords) return;
    
    setAiLoading(prev => ({ ...prev, [company]: true }));
    const generated = await generateWorkComment(keywords, name);
    handleCommentChange(company, generated);
    setAiLoading(prev => ({ ...prev, [company]: false }));
  };

  const steps: { id: Step; label: string; icon: any }[] = [
    { id: 'basis', label: 'Tag', icon: Calendar },
    { id: 'times', label: 'Zeiten', icon: Clock },
    { id: 'splits', label: 'Split', icon: Briefcase },
    { id: 'final', label: 'Notiz', icon: FileText },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const validateStep = (step: Step): boolean => {
    if (step === 'basis') return !!formData.date;
    if (step === 'times') {
      // Valid if: (StartM & Lunch) OR (StartN & End) OR (StartM & End)
      const hasMorning = !!formData.startM && !!formData.lunch;
      const hasAfternoon = !!formData.startN && !!formData.end;
      const hasDirect = !!formData.startM && !!formData.end;
      return hasMorning || hasAfternoon || hasDirect;
    }
    if (step === 'splits') {
      const isImported = formData.id?.startsWith('import-');
      const splitSum = (formData.splits?.med || 0) + (formData.splits?.bau || 0) + (formData.splits?.cursum || 0);
      if (splitSum > (roundedTotal + 0.01)) return false; // Buffer for precision
      if (!isImported) {
        if (formData.splits?.med! > 0 && !formData.comments?.med) return false;
        if (formData.splits?.bau! > 0 && !formData.comments?.bau) return false;
        if (formData.splits?.cursum! > 0 && !formData.comments?.cursum) return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9),
    } as TimeEntry);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden max-w-2xl mx-auto flex flex-col min-h-[600px]">
      {/* Header with Progress */}
      <div className="bg-slate-900 p-8 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20">
               {React.createElement(steps[currentStepIndex].icon, { className: "w-5 h-5" })}
             </div>
             <div>
               <h2 className="text-xl font-black tracking-tight">{steps[currentStepIndex].label}</h2>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Schritt {currentStepIndex + 1} von {steps.length}</p>
             </div>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex space-x-2">
          {steps.map((s, idx) => (
            <div 
              key={s.id} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx <= currentStepIndex ? 'bg-brand-500' : 'bg-slate-800'}`}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          {currentStep === 'basis' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-gray-900">Wann war dieser Einsatz?</h3>
                 <p className="text-sm text-gray-400 font-medium">Wähle das Datum deines Arbeitstages.</p>
               </div>
               <div className="space-y-6 pt-4">
                 <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Arbeitsdatum</label>
                    <input 
                      type="date" 
                      value={formData.date} 
                      onChange={(e) => handleChange('date', e.target.value)}
                      className="w-full px-6 py-5 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-brand-100 outline-none font-bold text-lg"
                    />
                 </div>
               </div>
            </div>
          )}

          {currentStep === 'times' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-gray-900">Arbeitszeiten erfassen</h3>
                 <p className="text-sm text-gray-400 font-medium">Bitte trage deine Präsenzzeiten ein. Für Kurzeinsätze reicht ein Block (z.B. Beginn & Mittag).</p>
               </div>
               <div className="bg-brand-500 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl shadow-brand-200 mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-200">Berechnetes Total</p>
                    <p className="text-3xl font-black">{formData.totalHours?.toFixed(2)} h</p>
                  </div>
                  <Clock className="w-8 h-8 opacity-40" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <TimeInputLarge label="Morgens" value={formData.startM!} onChange={(v) => handleChange('startM', v)} icon="☀️" />
                 <TimeInputLarge label="Mittag" value={formData.lunch!} onChange={(v) => handleChange('lunch', v)} icon="🥗" />
                 <TimeInputLarge label="Nachmittag" value={formData.startN!} onChange={(v) => handleChange('startN', v)} placeholder="Optional" icon="☕" />
                 <TimeInputLarge label="Feierabend" value={formData.end!} onChange={(v) => handleChange('end', v)} icon="🌙" />
               </div>
            </div>
          )}

          {currentStep === 'splits' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-gray-900">Projekt-Verteilung</h3>
                 <p className="text-sm text-gray-400 font-medium">Verteile deine {formData.totalHours?.toFixed(2)}h auf die Firmen.</p>
               </div>
               <div className="space-y-4">
                  <SplitInputStep label={COMPANIES.MED} hours={formData.splits?.med!} comment={formData.comments?.med!} onHourChange={(v) => handleSplitChange('med', v)} onCommentChange={(v) => handleCommentChange('med', v)} onGenerate={() => triggerAiComment('med', COMPANIES.MED)} isLoading={aiLoading.med} showRequired={!formData.id?.startsWith('import-')} />
                  <SplitInputStep label={COMPANIES.BAU} hours={formData.splits?.bau!} comment={formData.comments?.bau!} onHourChange={(v) => handleSplitChange('bau', v)} onCommentChange={(v) => handleCommentChange('bau', v)} onGenerate={() => triggerAiComment('bau', COMPANIES.BAU)} isLoading={aiLoading.bau} showRequired={!formData.id?.startsWith('import-')} />
                  <SplitInputStep label={COMPANIES.CURSUM} hours={formData.splits?.cursum!} comment={formData.comments?.cursum!} onHourChange={(v) => handleSplitChange('cursum', v)} onCommentChange={(v) => handleCommentChange('cursum', v)} onGenerate={() => triggerAiComment('cursum', COMPANIES.CURSUM)} isLoading={aiLoading.cursum} showRequired={!formData.id?.startsWith('import-')} />
                  <div className="p-6 bg-slate-900 rounded-3xl flex justify-between items-center text-white shadow-xl">
                    <div>
                      <p className="font-black">Rest: {COMPANIES.MAIN}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Wird automatisch verbucht</p>
                    </div>
                    <div className="text-2xl font-black text-brand-400">{formData.splits?.talentzio.toFixed(2)} h</div>
                  </div>
               </div>
            </div>
          )}

          {currentStep === 'final' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="text-center space-y-2">
                 <h3 className="text-2xl font-black text-gray-900">Fast fertig!</h3>
                 <p className="text-sm text-gray-400 font-medium">Gibt es noch etwas Wichtiges zu diesem Tag?</p>
               </div>
               <div className="space-y-4">
                  <textarea 
                    value={formData.note}
                    onChange={(e) => handleChange('note', e.target.value)}
                    className="w-full px-6 py-6 bg-gray-50 border-none rounded-3xl focus:ring-4 focus:ring-brand-100 outline-none h-40 resize-none font-medium text-lg"
                    placeholder="Allgemeine Notiz zum Tag (optional)..."
                  />
                  <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center">
                    <div className="p-3 bg-white rounded-2xl shadow-sm mr-4 text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
                    <div>
                      <p className="font-black text-emerald-900">Eintrag bereit</p>
                      <p className="text-xs text-emerald-700 font-medium">Alle Pflichtfelder für {formData.totalHours?.toFixed(2)}h sind ausgefüllt.</p>
                    </div>
                  </div>
               </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex flex-col gap-3">
         <div className="flex gap-3">
           {currentStepIndex > 0 && (
             <button 
               onClick={prevStep}
               className="flex-1 bg-white border border-gray-200 text-gray-600 font-black py-5 rounded-3xl flex items-center justify-center transition-all hover:bg-gray-50 active:scale-95"
             >
               <ChevronLeft className="w-5 h-5 mr-2" />
               Zurück
             </button>
           )}
           {currentStepIndex < steps.length - 1 ? (
             <button 
               onClick={nextStep}
               disabled={!validateStep(currentStep)}
               className="flex-[2] bg-brand-500 hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-black py-5 rounded-3xl flex items-center justify-center transition-all shadow-xl shadow-brand-500/20 active:scale-95"
             >
               Weiter
               <ChevronRight className="w-5 h-5 ml-2" />
             </button>
           ) : (
             <button 
               onClick={handleSubmit}
               className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-3xl flex items-center justify-center transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
             >
               <Save className="w-5 h-5 mr-2" />
               Speichern
             </button>
           )}
         </div>
      </div>
    </div>
  );
};

const TimeInputLarge = ({ label, value, onChange, placeholder, icon }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, icon: string }) => (
  <div className="space-y-2">
    <div className="flex items-center space-x-2 ml-1">
      <span className="text-lg">{icon}</span>
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</label>
    </div>
    <TimePicker 
      value={value} 
      onChange={onChange}
      placeholder={placeholder}
    />
  </div>
);

const SplitInputStep = ({ label, hours, comment, onHourChange, onCommentChange, onGenerate, isLoading, showRequired }: { 
  label: string, hours: number, comment: string, onHourChange: (v: string) => void, onCommentChange: (v: string) => void, onGenerate: () => void, isLoading?: boolean, showRequired?: boolean
}) => (
  <div className="p-5 rounded-3xl border-2 bg-white border-gray-100">
     <div className="flex justify-between items-center mb-4">
       <span className="font-black text-gray-900 tracking-tight">{label}</span>
       <div className="relative w-24">
         <input type="number" step="0.25" value={hours || ''} onChange={(e) => onHourChange(e.target.value)} placeholder="0.00" className="w-full bg-gray-50 border-none rounded-xl px-3 py-2 text-right font-black text-sm focus:ring-2 focus:ring-brand-500" />
         <span className="absolute left-2 top-2.5 text-[10px] font-bold text-gray-400">h</span>
       </div>
     </div>
     <div className="relative">
        <input type="text" value={comment} onChange={(e) => onCommentChange(e.target.value)} placeholder={hours > 0 ? (showRequired ? "Nachweis schreiben..." : "Optionaler Kommentar...") : "Keine Zeit erfasst"} disabled={hours === 0} className={`w-full px-5 py-4 rounded-2xl border-none outline-none text-sm font-medium pr-12 ${hours > 0 ? (comment ? 'bg-gray-50' : (showRequired ? 'bg-orange-50 ring-2 ring-orange-200' : 'bg-gray-50')) : 'bg-gray-100 text-gray-300'}`} />
        {hours > 0 && (
          <button type="button" onClick={onGenerate} disabled={!comment || isLoading} className="absolute right-3 top-4 text-brand-500 hover:text-brand-700">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        )}
     </div>
  </div>
);

export default EntryForm;
