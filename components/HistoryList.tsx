
import React, { useState } from 'react';
import { TimeEntry } from '../types';
import { formatDate, getWeekday } from '../utils';
import { Edit2, Search, Lock, MessageSquare, Trash2, AlertTriangle, X } from 'lucide-react';

interface HistoryListProps {
  entries: TimeEntry[];
  onEdit: (entry: TimeEntry) => void;
  onDelete: (id: string) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ entries, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.note.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          e.comments.med.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.comments.bau.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          e.comments.cursum.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Suche in Notizen & Kommentaren..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b">
              <tr>
                <th className="px-6 py-4">Datum / Wochentag</th>
                <th className="px-6 py-4">Zeiten (M / P / N / E)</th>
                <th className="px-6 py-4 text-center">Stunden</th>
                <th className="px-6 py-4">Splits (Hover für Kommentare)</th>
                <th className="px-6 py-4 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-brand-50/30 transition-colors group/row">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">{formatDate(entry.date)}</div>
                    <div className="text-xs text-gray-400">{getWeekday(entry.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className="font-medium">{entry.startM} - {entry.lunch}</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="font-medium">{entry.startN || '-'} - {entry.end}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${entry.totalHours > 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                      {entry.totalHours.toFixed(2)} h
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <SplitTag 
                        bgColor="#10183c" 
                        textColor="text-white"
                        label="Med" 
                        fullName="Talentzio Med AG"
                        hours={entry.splits.med} 
                        comment={entry.comments.med} 
                      />
                      <SplitTag 
                        bgColor="#ff501a" 
                        textColor="text-white"
                        label="Bau" 
                        fullName="Talentzio Bau AG"
                        hours={entry.splits.bau} 
                        comment={entry.comments.bau} 
                      />
                      <SplitTag 
                        bgColor="#4bf6bb" 
                        textColor="text-[#10183c]"
                        label="Cursum" 
                        fullName="Cursum AG"
                        hours={entry.splits.cursum} 
                        comment={entry.comments.cursum} 
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {entry.isLocked ? (
                      <div className="flex items-center justify-end text-gray-300">
                        <Lock className="w-4 h-4 mr-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Gesperrt</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => onEdit(entry)}
                          className="p-2 text-brand-600 hover:bg-brand-100 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                          title="Bearbeiten"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(entry.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all transform hover:scale-110 active:scale-95"
                          title="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-gray-900">{formatDate(entry.date)}</div>
                  <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{getWeekday(entry.date)}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${entry.totalHours > 0 ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-500'}`}>
                    {entry.totalHours.toFixed(2)} h
                  </span>
                  {!entry.isLocked && (
                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={() => onEdit(entry)}
                        className="p-2 text-brand-600 bg-brand-50 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(entry.id)}
                        className="p-2 text-red-500 bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {entry.isLocked && <Lock className="w-3.5 h-3.5 text-gray-300" />}
                </div>
              </div>

              <div className="flex items-center text-xs text-gray-600 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <span className="font-bold">{entry.startM} - {entry.lunch}</span>
                <span className="mx-2 text-gray-300">|</span>
                <span className="font-bold">{entry.startN || '-'} - {entry.end}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <SplitTag label="Med" hours={entry.splits.med} bgColor="#10183c" textColor="text-white" fullName="Med AG" comment={entry.comments.med} />
                <SplitTag label="Bau" hours={entry.splits.bau} bgColor="#ff501a" textColor="text-white" fullName="Bau AG" comment={entry.comments.bau} />
                <SplitTag label="Cursum" hours={entry.splits.cursum} bgColor="#4bf6bb" textColor="text-[#10183c]" fullName="Cursum AG" comment={entry.comments.cursum} />
              </div>
            </div>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-400 italic text-sm">
            Keine Einträge gefunden.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Eintrag löschen?</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                Bist du sicher, dass du diesen Eintrag unwiderruflich löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <div className="flex border-t">
              <button 
                onClick={() => setDeleteId(null)}
                className="flex-1 px-6 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors border-r"
              >
                Abbrechen
              </button>
              <button 
                onClick={() => {
                  onDelete(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 px-6 py-4 text-sm font-black text-red-600 hover:bg-red-50 transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SplitTagProps {
  bgColor: string;
  textColor: string;
  label: string;
  fullName: string;
  hours: number;
  comment: string;
}

const SplitTag: React.FC<SplitTagProps> = ({ bgColor, textColor, label, fullName, hours, comment }) => {
  if (hours <= 0) return null;

  return (
    <div className="relative group/tag inline-block">
      <div 
        style={{ backgroundColor: bgColor }}
        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${textColor} cursor-help shadow-sm border border-black/5 transition-transform group-hover/tag:scale-105 active:scale-95`}
      >
        {label}
      </div>
      
      {/* Tooltip Popup */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 hidden group-hover/tag:block z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl ring-1 ring-white/10">
          <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{fullName}</p>
              <p className="text-sm font-black text-brand-400">{hours.toFixed(2)} h</p>
            </div>
            <div style={{ backgroundColor: bgColor }} className="w-2 h-2 rounded-full mt-1" />
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center">
              <MessageSquare className="w-3 h-3 mr-1" /> Nachweis
            </p>
            <p className="text-xs font-medium text-slate-200 leading-relaxed italic">
              {comment || 'Kein Kommentar hinterlegt.'}
            </p>
          </div>
          
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900" />
        </div>
      </div>
    </div>
  );
};

export default HistoryList;
