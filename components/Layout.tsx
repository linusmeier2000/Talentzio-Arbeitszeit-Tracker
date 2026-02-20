
import React from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Settings as SettingsIcon, 
  FileDown, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: string[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, notifications }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'track', label: 'Erfassung', icon: Clock },
    { id: 'history', label: 'Verlauf', icon: Calendar },
    { id: 'export', label: 'Export', icon: FileDown },
    { id: 'settings', label: 'Einstellungen', icon: SettingsIcon },
  ];

 return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 print:bg-white print:block">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white sticky top-0 h-screen no-print">
        <div className="p-6">
          <h1 className="text-xl font-black tracking-tighter uppercase">Arbeitszeit</h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">Linus Meier • Talentzio</p>
        </div>
        
        <nav className="flex-1 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-4 transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-500 text-white shadow-lg z-10' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        {notifications.length > 0 && (activeTab !== 'track') && (
          <div className="p-4 bg-brand-900/20 m-4 rounded-2xl border border-brand-500/20 backdrop-blur-sm">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-brand-400 mr-2 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Meldung</p>
                <p className="text-xs text-brand-100/80 font-medium leading-relaxed mt-1">{notifications[0]}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 print:block print:w-full print:static">
        <header className="bg-white/80 backdrop-blur-md border-b h-14 md:h-16 flex items-center px-4 md:px-8 sticky top-0 z-40 justify-between no-print">
           <h2 className="text-xs md:text-sm font-black text-gray-900 uppercase tracking-widest">
             {menuItems.find(m => m.id === activeTab)?.label}
           </h2>
        </header>

        <div className="p-4 md:p-8 flex-1 print:p-0 print:block">
          {children}
        </div>

        {/* Navigation - Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t flex justify-around p-2 z-50 no-print">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                activeTab === item.id ? 'text-brand-500 bg-brand-50' : 'text-gray-400'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[8px] mt-1 font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
      </main>

      <style>{`
        @media print {
          aside, nav, header, .no-print { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; display: block !important; width: 100% !important; position: static !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;

