
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TimeEntry } from '../types';
import { 
  formatCurrency, 
  getMonthName, 
  getMonthlyCompanyHours, 
  calculateWageBreakdown, 
  getMonthlyHours,
  countBusinessDays 
} from '../utils';
import { 
  Clock, TrendingUp, Wallet, ChevronDown, Target, Info, 
  ArrowUpRight, ArrowDownRight, CalendarDays, Coins, Activity,
  BarChart3, Zap, Calendar, ArrowRight, RotateCcw, Percent,
  EyeOff
} from 'lucide-react';

import CalendarView from './CalendarView';

interface DashboardProps {
  entries: TimeEntry[];
  hourlyWage: number;
}

const Dashboard: React.FC<DashboardProps> = ({ entries, hourlyWage }) => {
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [activeSubTab, setActiveSubTab] = useState<'times' | 'finances'>('times');

  const handleMonthChange = (month: number, year: number) => {
    setViewMonth(month);
    setViewYear(year);
  };

  const isCurrentView = useMemo(() => {
    return viewMonth === now.getMonth() && viewYear === now.getFullYear();
  }, [viewMonth, viewYear, now]);

  const wageInfo = useMemo(() => calculateWageBreakdown(hourlyWage), [hourlyWage]);

  const availableYears = useMemo(() => {
    const years = entries.map(e => new Date(e.date).getFullYear());
    const unique = Array.from(new Set([...years, now.getFullYear()]));
    return unique.sort((a, b) => b - a);
  }, [entries]);

  const handleReset = () => {
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
  };

  const stats = useMemo(() => {
    const REFERENCE_WEEK_HOURS = 42.5;
    const HOURS_PER_DAY = 8.5;

    // Filter für ausgewählten Monat/Jahr
    const monthEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });

    const hoursMonth = monthEntries.reduce((sum, e) => sum + e.totalHours, 0);
    const netMonth = hoursMonth * wageInfo.netRate;

    // Aktuelle Woche (Montag-Sonntag) - Unabhängig vom Filter
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const mondayThisWeek = new Date(today);
    mondayThisWeek.setDate(today.getDate() + diffToMonday);
    mondayThisWeek.setHours(0, 0, 0, 0);

    const mondayLastWeek = new Date(mondayThisWeek);
    mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);
    const sundayLastWeek = new Date(mondayThisWeek);
    sundayLastWeek.setSeconds(-1);

    const weekEntries = entries.filter(e => new Date(e.date) >= mondayThisWeek);
    const lastWeekEntries = entries.filter(e => {
      const d = new Date(e.date);
      return d >= mondayLastWeek && d <= sundayLastWeek;
    });

    const hoursWeek = weekEntries.reduce((sum, e) => sum + e.totalHours, 0);
    const netWeek = hoursWeek * wageInfo.netRate;
    const netLastWeek = lastWeekEntries.reduce((sum, e) => sum + e.totalHours, 0) * wageInfo.netRate;
    const weekComparison = netLastWeek === 0 ? 0 : ((netWeek - netLastWeek) / netLastWeek) * 100;

    // Pensum Woche
    const pensumWeek = (hoursWeek / REFERENCE_WEEK_HOURS) * 100;

    // Pensum Monat
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const businessDaysMonth = countBusinessDays(firstOfMonth, lastOfMonth);
    const capacityMonth = businessDaysMonth * HOURS_PER_DAY;
    const pensumMonth = capacityMonth > 0 ? (hoursMonth / capacityMonth) * 100 : 0;

    // Pensum Jahr YTD
    const yearEntries = entries.filter(e => new Date(e.date).getFullYear() === viewYear);
    const hoursYear = yearEntries.reduce((sum, e) => sum + e.totalHours, 0);
    const startOfYear = new Date(viewYear, 0, 1);
    const endForYearCalc = (viewYear === now.getFullYear()) ? new Date() : new Date(viewYear, 11, 31);
    const businessDaysYearYTD = countBusinessDays(startOfYear, endForYearCalc);
    const capacityYearYTD = businessDaysYearYTD * HOURS_PER_DAY;
    const pensumYear = capacityYearYTD > 0 ? (hoursYear / capacityYearYTD) * 100 : 0;

    // Durchschnitt Stunden/Woche
    let weeksPassed = 52.14;
    if (viewYear === now.getFullYear()) {
      const diff = now.getTime() - startOfYear.getTime();
      weeksPassed = Math.max(1, diff / (1000 * 60 * 60 * 24 * 7));
    }
    const avgHoursPerWeek = hoursYear / weeksPassed;
    const pensumAvgWeek = (avgHoursPerWeek / REFERENCE_WEEK_HOURS) * 100;

    // Ø pro Monat (für Statistik-Karte)
    const monthsInCalc = viewYear === now.getFullYear() ? (now.getMonth() + 1) : 12;
    const avgHoursPerMonth = hoursYear / monthsInCalc;

    // Repräsentative Werte (Tage > 6h)
    const fullWorkDaysEntries = monthEntries.filter(e => e.totalHours > 6);
    const countFullWorkDays = fullWorkDaysEntries.length;
    const sumHoursFullDays = fullWorkDaysEntries.reduce((sum, e) => sum + e.totalHours, 0);
    const avgHoursPerDay = countFullWorkDays > 0 ? sumHoursFullDays / countFullWorkDays : 0;
    const avgDailyNet = avgHoursPerDay * wageInfo.netRate;

    return {
      hoursMonth, hoursYear, hoursWeek, avgHoursPerWeek, avgHoursPerMonth,
      netMonth, netWeek, weekComparison, pensumWeek, pensumMonth, pensumYear, pensumAvgWeek,
      avgDailyNet, avgHoursPerDay, workDays: countFullWorkDays,
      capacityWeek: REFERENCE_WEEK_HOURS, capacityMonth, capacityYear: capacityYearYTD
    };
  }, [entries, viewMonth, viewYear, wageInfo, now]);

  const dailyTrendData = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, cumulative: 0 }));
    let runningTotal = 0;
    
    entries.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    }).sort((a,b) => a.date.localeCompare(b.date)).forEach(e => {
      const dayNum = new Date(e.date).getDate();
      runningTotal += e.totalHours * wageInfo.netRate;
      data[dayNum - 1].cumulative = runningTotal;
    });

    for(let i=1; i<data.length; i++) {
      if(data[i].cumulative === 0) data[i].cumulative = data[i-1].cumulative;
    }
    return data;
  }, [entries, viewMonth, viewYear, wageInfo]);

  const chartData = useMemo(() => {
    const data = Array.from({ length: 12 }, (_, i) => ({ name: getMonthName(i).substring(0, 3), hours: 0, hoursPrev: 0 }));
    entries.forEach(e => {
      const d = new Date(e.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      if (y === viewYear) data[m].hours += e.totalHours;
      else if (y === viewYear - 1) data[m].hoursPrev += e.totalHours;
    });
    return data;
  }, [entries, viewYear]);

  const splitData = useMemo(() => {
    let med = 0, bau = 0, cursum = 0, talentzio = 0;
    entries.forEach(e => {
      const d = new Date(e.date);
      if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) {
        med += e.splits.med; bau += e.splits.bau; cursum += e.splits.cursum; talentzio += e.splits.talentzio;
      }
    });
    return [
      { name: 'Talentzio Med AG', value: med, color: '#10183c' },
      { name: 'Talentzio Bau AG', value: bau, color: '#ff501a' },
      { name: 'Cursum AG', value: cursum, color: '#4bf6bb' },
      { name: 'Talentzio AG (Rest)', value: talentzio, color: '#0280c9' },
    ].filter(v => v.value > 0);
  }, [entries, viewMonth, viewYear]);

  const cursumStats = useMemo(() => {
    const hours = getMonthlyCompanyHours(entries, 'cursum', viewMonth, viewYear);
    const limit = 6.0;
    const remaining = Math.max(0, limit - hours);
    const progress = Math.min(100, (hours / limit) * 100);
    return { hours, limit, remaining, progress, isOver: hours > limit };
  }, [entries, viewMonth, viewYear]);

  return (
    <div className="space-y-6 md:space-y-6">
      {/* Zentrale Steuerung */}
      <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3 md:gap-4 no-print sticky top-14 md:top-20 z-30">
        <div className="flex bg-gray-100 p-1 rounded-xl md:rounded-2xl w-full lg:w-auto">
          <button onClick={() => setActiveSubTab('times')} className={`flex-1 lg:flex-none flex items-center justify-center px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-xs transition-all ${activeSubTab === 'times' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Clock className="w-4 h-4 mr-2" /> Zeiten
          </button>
          <button onClick={() => setActiveSubTab('finances')} className={`flex-1 lg:flex-none flex items-center justify-center px-4 md:px-6 py-2 md:py-2.5 rounded-xl font-black text-xs transition-all ${activeSubTab === 'finances' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            <Coins className="w-4 h-4 mr-2" /> Finanzen
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zeitraum</span>
            <select value={viewMonth} onChange={(e) => setViewMonth(parseInt(e.target.value))} className="bg-transparent font-bold text-xs md:text-sm outline-none cursor-pointer">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{getMonthName(i)}</option>
              ))}
            </select>
            <span className="text-gray-300">/</span>
            <select value={viewYear} onChange={(e) => setViewYear(parseInt(e.target.value))} className="bg-transparent font-bold text-xs md:text-sm outline-none cursor-pointer">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <button 
            onClick={handleReset}
            className={`p-2 md:p-2.5 rounded-xl transition-all flex items-center group ${isCurrentView ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600'}`}
            title="Auf heute zurücksetzen"
          >
            <RotateCcw className={`w-4 h-4 mr-2 transition-transform duration-500 ${!isCurrentView ? 'group-hover:rotate-180' : ''}`} />
            <span className="text-[10px] font-black uppercase">Aktuell</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'times' ? (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <CalendarView 
            entries={entries} 
            viewMonth={viewMonth} 
            viewYear={viewYear} 
            onMonthChange={(m, y) => {
              setViewMonth(m);
              setViewYear(y);
            }} 
          />
          {/* Haupt-Metriken */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard 
              title="Stunden Woche" 
              value={`${stats.hoursWeek.toFixed(2)} h`} 
              pensum={stats.pensumWeek}
              icon={Calendar} 
              color="brand" 
              subText="Aktuelle Woche"
              comparison={`${stats.avgHoursPerWeek.toFixed(1)} h`}
              isOutOfContext={!isCurrentView}
            />
            <StatCard 
              title={`Stunden ${getMonthName(viewMonth)}`} 
              value={`${stats.hoursMonth.toFixed(2)} h`} 
              pensum={stats.pensumMonth}
              icon={Clock} 
              color="brand" 
              subText="Monatstotal" 
              comparison={`${stats.avgHoursPerMonth.toFixed(1)} h`}
            />
            <StatCard 
              title={`Total ${viewYear}`} 
              value={`${stats.hoursYear.toFixed(1)} h`} 
              pensum={stats.pensumYear}
              icon={BarChart3} 
              color="brand" 
              subText="Jahresfortschritt" 
            />
          </div>

          {/* Pensum Sektion */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 px-1">
              <Percent className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Detail-Analyse Arbeitspensum</h3>
              <div className="flex-1 h-px bg-gray-200"></div>
              {!isCurrentView && <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 flex items-center"><EyeOff className="w-3 h-3 mr-1.5" /> Fokus auf {getMonthName(viewMonth)} {viewYear}</span>}
              {isCurrentView && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Ziel: 40-50% (Ref. 42.5h)</span>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              <PensumCard 
                label="Wochen-Pensum" 
                percent={stats.pensumWeek} 
                hours={stats.hoursWeek} 
                capacity={stats.capacityWeek} 
                isOutOfContext={!isCurrentView}
              />
              <PensumCard 
                label={`Monats-Pensum (${getMonthName(viewMonth)})`} 
                percent={stats.pensumMonth} 
                hours={stats.hoursMonth} 
                capacity={stats.capacityMonth} 
              />
              <PensumCard 
                label={`Jahres-Pensum (${viewYear})`} 
                percent={stats.pensumYear} 
                hours={stats.hoursYear} 
                capacity={stats.capacityYear} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] border shadow-sm">
              <h3 className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 md:mb-8">Stunden-Entwicklung {viewYear}</h3>
              <div className="h-[240px] md:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}h`} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="hoursPrev" name="Vorjahr" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="hours" name="Aktuell" fill="#0280c9" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className={`p-5 md:p-8 rounded-2xl md:rounded-[3rem] border transition-all duration-700 ${cursumStats.isOver ? 'bg-red-50 border-red-200 shadow-xl shadow-red-100' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="flex justify-between items-start mb-4 md:mb-6">
                   <div className={`p-3 rounded-2xl ${cursumStats.isOver ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400'}`}>
                     <Target className="w-5 h-5" />
                   </div>
                   <div className="text-right">
                     <p className={`text-[10px] font-black uppercase tracking-widest ${cursumStats.isOver ? 'text-red-400' : 'text-gray-400'}`}>Cursum AG</p>
                     <p className={`text-sm font-black ${cursumStats.isOver ? 'text-red-900' : 'text-gray-900'}`}>{cursumStats.hours.toFixed(1)} / 6.0 h</p>
                   </div>
                </div>
                
                <div className="mb-4 md:mb-4">
                  <p className={`text-[10px] md:text-xs font-bold mb-1 ${cursumStats.isOver ? 'text-red-600' : 'text-gray-400'}`}>
                    {cursumStats.isOver ? 'Budget überschritten!' : 'Verbleibend'}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-4xl md:text-5xl font-black tracking-tighter ${cursumStats.isOver ? 'text-red-600' : 'text-brand-500'}`}>{cursumStats.remaining.toFixed(1)}</span>
                    <span className="text-xl font-bold text-gray-300">h</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${cursumStats.isOver ? 'bg-red-500' : 'bg-brand-500'}`} 
                      style={{ width: `${cursumStats.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] border shadow-sm">
                <h3 className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 md:mb-6">Split {getMonthName(viewMonth)}</h3>
                <div className="h-40 md:h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={splitData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                        {splitData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {splitData.map(s => (
                    <div key={s.name} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-xl">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: s.color}}></div>
                      <span className="text-[10px] font-bold text-gray-600 truncate">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          {/* Finance Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-6">
            <div className="lg:col-span-2 bg-emerald-600 p-6 md:p-10 rounded-2xl md:rounded-[3rem] text-white shadow-2xl shadow-emerald-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="relative z-10">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-70 mb-1 md:mb-2">Netto Einnahmen {getMonthName(viewMonth)} {viewYear}</p>
                  <h2 className="text-3xl sm:text-6xl font-black tracking-tighter mb-2 md:mb-4">{formatCurrency(stats.netMonth)}</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-xs font-black px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md">
                      Basierend auf {stats.hoursMonth.toFixed(1)}h total
                    </div>
                  </div>
              </div>
            </div>

            {/* Wochen-Einnahmen Block */}
            <div className={`bg-white p-6 md:p-10 rounded-2xl md:rounded-[3rem] border shadow-xl flex flex-col justify-center relative overflow-hidden group transition-all duration-700 ${!isCurrentView ? 'blur-md opacity-50 grayscale pointer-events-none scale-95' : ''}`}>
               {!isCurrentView && (
                 <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/10 backdrop-blur-xs">
                   <span className="bg-gray-900 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-xl">Live-Modus inaktiv</span>
                 </div>
               )}
               <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Diese Woche (Live)</p>
               <h3 className="text-4xl font-black text-gray-900 tracking-tight mb-2">{formatCurrency(stats.netWeek)}</h3>
               <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-emerald-600 flex items-center">
                    <ArrowRight className="w-3 h-3 mr-1" /> {stats.hoursWeek.toFixed(1)}h erfasst
                  </p>
                  {stats.weekComparison !== 0 && (
                    <div className={`text-[10px] font-black flex items-center ${stats.weekComparison > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {stats.weekComparison > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                      {Math.abs(stats.weekComparison).toFixed(1)}% vs. Vorwoche
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-2xl md:rounded-[3rem] border shadow-sm">
              <h3 className="text-[10px] md:text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-4 md:mb-8">Einnahmen-Verlauf {getMonthName(viewMonth)}</h3>
              <div className="h-[200px] md:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrendData}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `CHF ${val}`} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                    <Area type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={6} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-8 rounded-xl md:rounded-[3rem] border border-gray-100 space-y-4 md:space-y-8 h-fit">
               <div className="space-y-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                      <Info className="w-4 h-4 mr-2" /> Repräsentative Werte
                    </h3>
                    <span className="text-[8px] font-bold text-gray-300 uppercase bg-white px-2 py-0.5 rounded-full border border-gray-100">Tage &gt; 6h</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Ø pro Arbeitstag</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xl font-black text-gray-900 leading-none">{formatCurrency(stats.avgDailyNet)}</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">Netto-Einnahme</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-brand-600 leading-none">{stats.avgHoursPerDay.toFixed(2)}h</p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">Arbeitszeit</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Netto-Stundensatz</p>
                        <p className="text-xl font-black text-emerald-700">{formatCurrency(wageInfo.netRate)} <span className="text-[10px] text-emerald-600/50">/ h</span></p>
                      </div>
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
               </div>

               <div className="bg-slate-900 p-6 rounded-[2rem] text-white/90 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Lohn-Zusammensetzung</h4>
                  <div className="space-y-3 text-[11px]">
                    <div className="flex justify-between">
                      <span className="opacity-60">Basislohn</span>
                      <span className="font-bold">{formatCurrency(wageInfo.baseRate)}</span>
                    </div>
                    <div className="flex justify-between text-brand-400">
                      <span className="opacity-60">Zuschläge (Ferien+)</span>
                      <span className="font-bold">+{formatCurrency(wageInfo.ferien + wageInfo.feiertag + wageInfo.thirteenth)}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span className="opacity-60">Sozialabzüge</span>
                      <span className="font-bold">-{formatCurrency(wageInfo.totalDeductions)}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Effektiv Netto</span>
                    <span className="text-sm font-black text-white">{formatCurrency(wageInfo.netRate)}</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PensumCard = ({ label, percent, hours, capacity, isOutOfContext }: { label: string, percent: number, hours: number, capacity: number, isOutOfContext?: boolean }) => {
  // Ziel: 40-50%
  const isTarget = percent >= 40 && percent <= 50;
  const isOver = percent > 50;

  const colorClass = isTarget 
    ? 'text-emerald-600 border-emerald-100 bg-emerald-50/30' 
    : isOver 
      ? 'text-brand-600 border-brand-100 bg-brand-50/30' 
      : 'text-slate-600 border-slate-100 bg-slate-50/30';

  return (
    <div className={`p-5 md:p-6 rounded-2xl md:rounded-[2rem] border shadow-sm transition-all duration-700 relative overflow-hidden group hover:shadow-md ${colorClass} ${isOutOfContext ? 'blur-md opacity-50 grayscale pointer-events-none scale-95' : ''}`}>
      {isOutOfContext && (
        <div className="absolute inset-0 z-10 bg-white/20 flex items-center justify-center">
           <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-white/80 px-2 py-1 rounded shadow-sm">Live-Statistik</span>
        </div>
      )}
      <div className="flex justify-between items-start mb-4 md:mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</h4>
        {isTarget && (
          <div className="bg-emerald-500 text-white p-1 rounded-lg">
            <Zap className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-black tracking-tight">{percent.toFixed(1)}%</span>
        <span className="text-xs font-bold opacity-40">Pensum</span>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-[10px] font-bold opacity-50">
          <span>{hours.toFixed(1)}h</span>
          <span>Soll: {capacity.toFixed(1)}h</span>
        </div>
        <div className="h-1.5 w-full bg-white/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isTarget ? 'bg-emerald-500' : isOver ? 'bg-brand-500' : 'bg-slate-400'}`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, pensum, subText, icon: Icon, color, isOutOfContext, comparison }: { 
  title: string, value: string, pensum?: number, subText: string, icon: any, color: string, isOutOfContext?: boolean, comparison?: string
}) => {
  const colorMap: any = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  };

  const isTarget = pensum !== undefined && pensum >= 40 && pensum <= 50;
  const isOver = pensum !== undefined && pensum > 50;

  return (
    <div className={`bg-white p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border shadow-sm group hover:shadow-md transition-all duration-700 relative overflow-hidden ${isOutOfContext ? 'blur-md opacity-50 grayscale pointer-events-none scale-95' : ''}`}>
      {isOutOfContext && (
        <div className="absolute inset-0 z-10 bg-white/10 flex items-center justify-center">
           <span className="text-[7px] font-black uppercase tracking-widest text-slate-400 bg-white/80 px-2 py-0.5 rounded shadow-sm">Inaktiv</span>
        </div>
      )}
      <div className="flex justify-between items-start mb-4 md:mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color]} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        {pensum !== undefined && (
          <div className={`flex items-center text-[10px] font-black px-2.5 py-1 rounded-full border transition-colors ${
            isTarget ? 'bg-emerald-50 text-emerald-600 border-emerald-100 ring-2 ring-emerald-500/10' : 
            isOver ? 'bg-brand-50 text-brand-600 border-brand-100' : 
            'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            {pensum.toFixed(0)}% {isTarget && <Zap className="w-2.5 h-2.5 ml-1" />}
          </div>
        )}
      </div>
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">{title}</h4>
      <div className="text-2xl font-black text-gray-900 mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-gray-400 tracking-tight">{subText}</p>
        {comparison && (
          <div className="flex items-center space-x-1.5">
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">Ø</span>
            <span className="text-[10px] font-black text-brand-600">{comparison}</span>
          </div>
        )}
      </div>
      
      {pensum !== undefined && (
        <div className="mt-2 h-0.5 w-full bg-gray-50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${isTarget ? 'bg-emerald-500' : isOver ? 'bg-brand-500' : 'bg-gray-200'}`}
            style={{ width: `${Math.min(100, pensum)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
