
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import HistoryList from './components/HistoryList';
import ExportPanel from './components/ExportPanel';
import { TimeEntry, UserSettings, CompanySplit, CompanyComments } from './types';
import { DEFAULT_SETTINGS, INITIAL_IMPORT_DATA, COMPANIES } from './constants';
import { 
  PlusCircle, 
  Clock, 
  Save, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Loader2, 
  FileText,
  Calculator,
  Wallet,
  ArrowUp,
  ArrowDown,
  Timer
} from 'lucide-react';
import { calculateWageBreakdown, formatCurrency, calculateTotalHours, roundTo } from './utils';
import { generateWorkComment } from './services/geminiService';

const STORAGE_KEY_ENTRIES = 'at_entries_v1';
const STORAGE_KEY_SETTINGS = 'at_settings_v1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Status für das heutige Quick-Edit
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = useMemo(() => entries.find(e => e.date === todayStr), [entries, todayStr]);
  const [quickEditData, setQuickEditData] = useState<TimeEntry | null>(null);
  const [quickEditStep, setQuickEditStep] = useState<'times' | 'splits' | 'notes'>('times');
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});

  // Sortierte Einträge für die Liste (Neueste zuerst, Top 10)
  const sortedRecentEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [entries]);

  useEffect(() => {
    const savedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
    if (savedEntries) setEntries(JSON.parse(savedEntries));
    else setEntries(INITIAL_IMPORT_DATA);
    
    const savedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Initialisiere Quick-Edit wenn ein heutiger Eintrag gefunden wird
  useEffect(() => {
    if (todayEntry) {
      setQuickEditData(todayEntry);
    } else {
      setQuickEditData(null);
    }
  }, [todayEntry]);

  const notifications = useMemo(() => {
    const msgs = [];
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);
    const hasRecent = entries.some(e => new Date(e.date) >= twoDaysAgo);
    if (!hasRecent && entries.length > 0) msgs.push("Du hast seit 2 Tagen keine Zeiten erfasst.");
    return msgs;
  }, [entries]);

  const handleSaveEntry = (newEntry: TimeEntry) => {
    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === newEntry.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newEntry;
        return copy;
      }
      return [...prev, newEntry];
    });
    setShowForm(false);
    setEditingEntry(null);
  };

  const handleQuickSave = () => {
    if (!quickEditData) return;
    
    const rawTotal = calculateTotalHours(
      quickEditData.startM,
      quickEditData.lunch,
      quickEditData.startN,
      quickEditData.end
    );
    const roundedTotal = roundTo(rawTotal, settings.roundingMinutes);
    
    const splitSum = quickEditData.splits.med + quickEditData.splits.bau + quickEditData.splits.cursum;
    const newMain = Math.max(0, roundedTotal - splitSum);
    
    const updated: TimeEntry = {
      ...quickEditData,
      totalHours: roundedTotal,
      splits: {
        ...quickEditData.splits,
        talentzio: newMain
      }
    };
    
    handleSaveEntry(updated);
    alert('Eintrag für heute wurde aktualisiert.');
  };

  const handleToggleLock = (startDate: string, endDate: string, lock: boolean) => {
    setEntries(prev => prev.map(e => {
      if (e.date >= startDate && e.date <= endDate) {
        return { ...e, isLocked: lock };
      }
      return e;
    }));
  };

  const handleUpdateExportDate = (date: string) => {
    setSettings(prev => ({ ...prev, lastExportDate: date }));
  };

  const triggerAiComment = async (company: keyof CompanyComments, name: string) => {
    if (!quickEditData) return;
    const keywords = quickEditData.comments?.[company] || '';
    if (!keywords) return;
    
    setAiLoading(prev => ({ ...prev, [company]: true }));
    const generated = await generateWorkComment(keywords, name);
    setQuickEditData({
      ...quickEditData,
      comments: { ...quickEditData.comments, [company]: generated }
    });
    setAiLoading(prev => ({ ...prev, [company]: false }));
  };

  const renderContent = () => {
    if (showForm) return <EntryForm initialData={editingEntry || undefined} entries={entries} onSave={handleSaveEntry} onCancel={() => { setShowForm(false); setEditingEntry(null); }} onDelete={(id) => { if (confirm('Löschen?')) setEntries(prev => prev.filter(e => e.id !== id)); setShowForm(false); }} />;

    switch (activeTab) {
      case 'dashboard': return <Dashboard entries={entries} hourlyWage={settings.wages[0].rate} />;
      case 'track': return (
        <div className="flex flex-col space-y-12 py-12 no-print max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            {/* Box 1: Neuer Eintrag */}
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl shadow-brand-100/20 text-center flex flex-col justify-center transition-all hover:scale-[1.01] hover:shadow-brand-100/30">
              <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-8 text-brand-600 shadow-inner">
                <PlusCircle className="w-12 h-12" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter">Zeit erfassen</h3>
              <p className="text-sm font-bold text-gray-400 mt-3 mb-10 uppercase tracking-widest">Neuen Arbeitstag dokumentieren</p>
              <button 
                onClick={() => setShowForm(true)} 
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-black py-6 rounded-[2rem] transition-all shadow-xl shadow-brand-500/30 active:scale-95 flex items-center justify-center space-x-3 text-lg"
              >
                <PlusCircle className="w-6 h-6" />
                <span>Jetzt starten</span>
              </button>
            </div>

            {/* Box 2: Heute im Blick - Luxury Mini-Editor */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-emerald-100/20 relative overflow-hidden flex flex-col min-h-[600px] transition-all hover:scale-[1.01]">
              {/* Header Accent Bar */}
              <div className={`h-2 w-full transition-colors duration-500 ${quickEditStep === 'times' ? 'bg-emerald-500' : quickEditStep === 'splits' ? 'bg-brand-500' : 'bg-slate-800'}`} />
              
              <div className="p-10 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl ${quickEditStep === 'times' ? 'bg-emerald-50 text-emerald-600' : quickEditStep === 'splits' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-600'}`}>
                      {quickEditStep === 'times' && <Timer className="w-6 h-6" />}
                      {quickEditStep === 'splits' && <PlusCircle className="w-6 h-6" />}
                      {quickEditStep === 'notes' && <FileText className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">Heute im Blick</h3>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        {quickEditStep === 'times' ? 'Präsenzzeit anpassen' : quickEditStep === 'splits' ? 'Leistungs-Verteilung' : 'Persönliche Notizen'}
                      </p>
                    </div>
                  </div>
                  {quickEditData && (
                    <div className="flex items-center space-x-2">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${quickEditStep === 'times' ? 'bg-emerald-500 w-6' : 'bg-gray-200 w-2'}`} />
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${quickEditStep === 'splits' ? 'bg-brand-500 w-6' : 'bg-gray-200 w-2'}`} />
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${quickEditStep === 'notes' ? 'bg-slate-800 w-6' : 'bg-gray-200 w-2'}`} />
                    </div>
                  )}
                </div>

                {quickEditData ? (
                  <div className="flex-1 flex flex-col">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                      {quickEditStep === 'times' && (
                        <div className="grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                          <QuickInputLarge label="Beginn M" value={quickEditData.startM} onChange={v => setQuickEditData({...quickEditData, startM: v})} />
                          <QuickInputLarge label="Mittag" value={quickEditData.lunch} onChange={v => setQuickEditData({...quickEditData, lunch: v})} />
                          <QuickInputLarge label="Beginn N" value={quickEditData.startN} onChange={v => setQuickEditData({...quickEditData, startN: v})} />
                          <QuickInputLarge label="Ende" value={quickEditData.end} onChange={v => setQuickEditData({...quickEditData, end: v})} />
                          <div className="col-span-2 mt-8 p-6 bg-emerald-50/50 rounded-[2rem] flex justify-between items-center border border-emerald-100/50 group">
                            <div>
                              <span className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest block mb-1">Total Stunden</span>
                              <span className="text-4xl font-black text-emerald-900 tracking-tighter">{calculateTotalHours(quickEditData.startM, quickEditData.lunch, quickEditData.startN, quickEditData.end).toFixed(2)} h</span>
                            </div>
                            <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                              <Clock className="w-8 h-8 text-emerald-500" />
                            </div>
                          </div>
                        </div>
                      )}

                      {quickEditStep === 'splits' && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                          <QuickSplitCard label="Talentzio Med AG" color="#10183c" hours={quickEditData.splits.med} comment={quickEditData.comments.med} onHourChange={v => setQuickEditData({...quickEditData, splits: {...quickEditData.splits, med: parseFloat(v) || 0}})} onCommentChange={v => setQuickEditData({...quickEditData, comments: {...quickEditData.comments, med: v}})} onGenerate={() => triggerAiComment('med', 'Med AG')} isLoading={aiLoading.med} />
                          <QuickSplitCard label="Talentzio Bau AG" color="#ff501a" hours={quickEditData.splits.bau} comment={quickEditData.comments.bau} onHourChange={v => setQuickEditData({...quickEditData, splits: {...quickEditData.splits, bau: parseFloat(v) || 0}})} onCommentChange={v => setQuickEditData({...quickEditData, comments: {...quickEditData.comments, bau: v}})} onGenerate={() => triggerAiComment('bau', 'Bau AG')} isLoading={aiLoading.bau} />
                          <QuickSplitCard label="Cursum AG" color="#4bf6bb" hours={quickEditData.splits.cursum} comment={quickEditData.comments.cursum} onHourChange={v => setQuickEditData({...quickEditData, splits: {...quickEditData.splits, cursum: parseFloat(v) || 0}})} onCommentChange={v => setQuickEditData({...quickEditData, comments: {...quickEditData.comments, cursum: v}})} onGenerate={() => triggerAiComment('cursum', 'Cursum AG')} isLoading={aiLoading.cursum} />
                          <div className="text-[10px] font-black text-center text-gray-400 uppercase tracking-[0.3em] bg-gray-50/50 py-4 rounded-2xl border border-gray-100 mt-4">
                            Rest: Talentzio AG ({quickEditData.splits.talentzio.toFixed(2)}h)
                          </div>
                        </div>
                      )}

                      {quickEditStep === 'notes' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                          <textarea 
                            value={quickEditData.note} 
                            onChange={e => setQuickEditData({...quickEditData, note: e.target.value})}
                            placeholder="Möchtest du etwas zum heutigen Tag festhalten? (Notiz...)"
                            className="w-full h-64 p-8 bg-gray-50/50 rounded-[2.5rem] border-none outline-none focus:ring-2 focus:ring-slate-200 font-medium text-lg resize-none leading-relaxed placeholder:text-gray-300"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-10 flex gap-4 no-print">
                      <button 
                        onClick={() => {
                          if (quickEditStep === 'times') setQuickEditStep('notes');
                          else if (quickEditStep === 'splits') setQuickEditStep('times');
                          else setQuickEditStep('notes');
                        }}
                        className="p-5 bg-gray-100 text-gray-500 rounded-[1.5rem] hover:bg-gray-200 transition-all active:scale-90"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      
                      <button 
                        onClick={handleQuickSave}
                        className="flex-1 bg-slate-900 hover:bg-black text-white font-black rounded-[1.5rem] transition-all shadow-xl flex items-center justify-center space-x-3 active:scale-95 text-sm uppercase tracking-[0.2em]"
                      >
                        <Save className="w-5 h-5" />
                        <span>Sichern</span>
                      </button>

                      <button 
                        onClick={() => {
                          if (quickEditStep === 'times') setQuickEditStep('splits');
                          else if (quickEditStep === 'splits') setQuickEditStep('notes');
                          else setQuickEditStep('times');
                        }}
                        className={`p-5 text-white rounded-[1.5rem] transition-all active:scale-90 shadow-lg ${quickEditStep === 'times' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-brand-500 shadow-brand-500/20'}`}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 shadow-inner">
                      <AlertCircle className="w-12 h-12" />
                    </div>
                    <div className="max-w-xs">
                      <h4 className="text-gray-900 font-black text-2xl tracking-tight">Pause gefällig?</h4>
                      <p className="text-sm text-gray-400 font-bold mt-2 leading-relaxed uppercase tracking-widest">Noch kein Eintrag für heute</p>
                      <p className="text-xs text-gray-400 mt-4 leading-relaxed font-medium">Erstelle zuerst einen Eintrag, um hier die Schnellbearbeitung nutzen zu können.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full">
            <div className="flex items-center space-x-4 mb-8">
              <div className="h-px bg-gray-200 flex-1" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.4em]">Letzte 10 Aktivitäten</h4>
              <div className="h-px bg-gray-200 flex-1" />
            </div>
            <HistoryList 
              entries={sortedRecentEntries} 
              onEdit={(e) => { setEditingEntry(e); setShowForm(true); }} 
            />
          </div>
        </div>
      );
      case 'history': return <HistoryList entries={entries} onEdit={(e) => { setEditingEntry(e); setShowForm(true); }} />;
      case 'export': return <ExportPanel entries={entries} settings={settings} onToggleLock={handleToggleLock} onUpdateExportDate={handleUpdateExportDate} />;
      case 'settings': return <SettingsPanel settings={settings} setSettings={setSettings} entries={entries} />;
      default: return <div>In Entwicklung...</div>;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} notifications={notifications}>
      {renderContent()}
      {!showForm && activeTab !== 'track' && (
        <button 
          onClick={() => setShowForm(true)} 
          className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-20 h-20 bg-slate-900 text-white rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30 no-print" 
          title="Schnellerfassung"
        >
          <PlusCircle className="w-10 h-10" />
        </button>
      )}
    </Layout>
  );
};

// --- Refined Quick Edit Components ---

const QuickInputLarge = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-3 group">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 group-focus-within:text-emerald-500 transition-colors">{label}</label>
    <input 
      type="time" 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full p-6 bg-gray-50 border-2 border-transparent rounded-[1.5rem] outline-none focus:bg-white focus:border-emerald-200 focus:ring-4 focus:ring-emerald-50 font-black text-xl transition-all shadow-sm" 
    />
  </div>
);

const QuickSplitCard = ({ label, color, hours, comment, onHourChange, onCommentChange, onGenerate, isLoading }: any) => {
  const isSelected = hours > 0;
  
  return (
    <div className={`p-6 rounded-[2rem] border-2 transition-all duration-300 ${
      isSelected 
        ? 'bg-white shadow-xl border-gray-100' 
        : 'bg-gray-50/50 border-transparent opacity-60'
    }`}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color }} />
          <span className="text-sm font-black uppercase tracking-widest text-gray-900">{label}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <input 
              type="number" step="0.25" placeholder="0.00" value={hours || ''} 
              onChange={e => onHourChange(e.target.value)}
              className="w-20 bg-gray-50 border-none rounded-xl px-3 py-2 text-right font-black text-sm focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <span className="absolute -right-5 top-2.5 text-[10px] font-black text-gray-300 uppercase">h</span>
          </div>
        </div>
      </div>
      
      <div className="relative group/input">
        <input 
          type="text" 
          value={comment} 
          onChange={e => onCommentChange(e.target.value)}
          placeholder={isSelected ? "Was wurde erledigt?" : "Keine Zeit eingetragen"}
          disabled={!isSelected}
          className={`w-full pl-4 pr-12 py-3 rounded-xl border-none text-xs font-bold outline-none transition-all ${
            isSelected 
              ? 'bg-gray-50 focus:bg-white focus:ring-2 focus:ring-brand-100 placeholder:text-gray-300' 
              : 'bg-transparent text-gray-300 placeholder:text-gray-200'
          }`}
        />
        {isSelected && (
          <button 
            onClick={onGenerate} 
            disabled={!comment || isLoading} 
            className="absolute right-3 top-3 text-brand-500 hover:text-emerald-500 disabled:text-gray-300 transition-all hover:scale-110"
            title="KI Kommentar generieren"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- Settings Panel ---

const SettingsPanel = ({ settings, setSettings, entries }: { settings: UserSettings, setSettings: (s: UserSettings) => void, entries: TimeEntry[] }) => {
  const wageBreakdown = useMemo(() => calculateWageBreakdown(settings.wages[0].rate), [settings.wages]);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20 no-print">
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
        <div>
          <h3 className="text-2xl font-black text-gray-900 border-b border-gray-50 pb-6 mb-8 tracking-tight">Profil & Basis-Lohn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vollständiger Name</label>
              <input type="text" value={settings.userName} onChange={(e) => setSettings({ ...settings, userName: e.target.value })} className="w-full p-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-bold text-lg" />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Grund-Stundenlohn</label>
              <div className="relative">
                <input type="number" step="0.01" value={settings.wages[0].rate} onChange={(e) => setSettings({ ...settings, wages: [{ ...settings.wages[0], rate: parseFloat(e.target.value) || 0 }] })} className="w-full p-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-500 font-black text-brand-600 text-lg" />
                <span className="absolute right-5 top-5 text-xs font-black text-gray-400">CHF/h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-50 rounded-2xl text-brand-500 shadow-sm"><Calculator className="w-6 h-6" /></div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Detaillierte Lohnberechnung</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100">
              <div className="flex items-center text-emerald-700 font-black text-xs uppercase tracking-[0.2em] mb-6">
                <ArrowUp className="w-4 h-4 mr-2" /> Zuzüge (Benefits)
              </div>
              <div className="space-y-4">
                <WageItem label="Basislohn" value={wageBreakdown.baseRate} />
                <WageItem label={`Feriengeld (10.64%)`} value={wageBreakdown.ferien} />
                <WageItem label={`Feiertaggeld (1.5%)`} value={wageBreakdown.feiertag} />
                <div className="pt-3 border-t border-emerald-100 mt-2 flex justify-between items-center opacity-60">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight">Zwischentotal</span>
                  <span className="font-bold text-emerald-800 text-xs">{formatCurrency(wageBreakdown.subtotal1)}</span>
                </div>
                <WageItem label={`13. Monatslohn (8.333%)`} value={wageBreakdown.thirteenth} />
                <div className="pt-5 border-t border-emerald-200 mt-4 flex justify-between items-center">
                  <span className="font-black text-emerald-900 text-base">Bruttolohn</span>
                  <span className="font-black text-emerald-900 text-lg">{formatCurrency(wageBreakdown.grossRate)}</span>
                </div>
              </div>
            </div>

            <div className="bg-red-50/30 p-8 rounded-[2rem] border border-red-100">
              <div className="flex items-center text-red-700 font-black text-xs uppercase tracking-[0.2em] mb-6">
                <ArrowDown className="w-4 h-4 mr-2" /> Abzüge (Social)
              </div>
              <div className="space-y-4">
                <WageItem label={`AHV/IV/EO (5.3%)`} value={-wageBreakdown.ahv} isNegative />
                <WageItem label={`ALV (1.1%)`} value={-wageBreakdown.alv} isNegative />
                <WageItem label={`NBU (0.73%)`} value={-wageBreakdown.nbu} isNegative />
                <WageItem label={`UVGZ (0.095%)`} value={-wageBreakdown.uvgz} isNegative />
                <WageItem label={`KTG (0.39%)`} value={-wageBreakdown.ktg} isNegative />
                <div className="pt-5 border-t border-red-200 mt-6 flex justify-between items-center">
                  <span className="font-bold text-red-900 text-xs uppercase tracking-widest">Total Abzüge</span>
                  <span className="font-bold text-red-900 text-lg">{formatCurrency(-wageBreakdown.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex flex-col sm:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/20 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="z-10 text-center sm:text-left">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Ihr berechneter Nettolohn</p>
              <h4 className="text-5xl font-black text-brand-400 tracking-tighter">{formatCurrency(wageBreakdown.netRate)} <span className="text-base font-bold text-slate-500 tracking-normal">/ Stunde</span></h4>
            </div>
            <div className="z-10 bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 flex items-center space-x-5">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 shadow-inner">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Effektiv Netto</p>
                <p className="text-sm font-bold text-white leading-tight">Garantierte<br/>Auszahlung</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-10 border-t border-gray-100 flex gap-4">
          <button onClick={() => { const data = JSON.stringify(entries); const blob = new Blob([data], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `backup_arbeitszeit.json`; a.click(); }} className="flex-1 px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-slate-900 hover:text-white font-black text-xs uppercase tracking-widest transition-all">Sicherheits-Backup (JSON)</button>
        </div>
      </div>
    </div>
  );
};

const WageItem = ({ label, value, isNegative }: { label: string, value: number, isNegative?: boolean }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="font-bold text-gray-500 tracking-tight">{label}</span>
    <span className={`font-black ${isNegative ? 'text-red-500' : 'text-gray-900'}`}>{formatCurrency(value)}</span>
  </div>
);

export default App;
