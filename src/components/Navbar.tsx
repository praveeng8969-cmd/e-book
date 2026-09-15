import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  FileSpreadsheet,
  Menu,
  BookMarked,
  Zap,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type MainView = 'reader' | 'simlab' | 'formulas' | 'manuscript';

interface NavbarProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen request failed or restricted:', err);
    }
  };

  const navItems: { id: MainView; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'reader', label: 'E-Book Reader', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'formulas', label: 'Formula Vault', icon: <FileSpreadsheet className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 md:px-8 py-3 flex items-center justify-between gap-3">
      {/* Left Table of Contents toggle + title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${
            isSidebarOpen
              ? 'bg-slate-900 border-slate-700 text-white hover:text-cyan-300 hover:bg-slate-800 shadow-xs'
              : 'bg-slate-900 border-slate-800 text-white hover:text-cyan-300 hover:bg-slate-800 shadow-xs'
          }`}
          title={isSidebarOpen ? 'Hide Table of Contents' : 'Show Table of Contents'}
          aria-label={isSidebarOpen ? 'Hide Table of Contents' : 'Show Table of Contents'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-white" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-white" />
          )}
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 font-mono pl-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="font-semibold tracking-wide">THERMODYNAMICS</span>
        </div>
      </div>

      {/* Center Nav Items */}
      <nav className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap border ${
                isActive
                  ? 'nav-tab-active bg-teal-50 border-teal-500 text-teal-900 shadow-xs dark:bg-teal-500/15 dark:border-teal-500/60 dark:text-[#5EEAD4]'
                  : 'bg-transparent border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-[#F8FAFC] dark:hover:bg-slate-800/60'
              }`}
            >
              {item.icon}
              <span className="hidden md:inline font-bold">{item.label}</span>
              <span className="md:hidden font-bold">{item.label.split(' ')[0]}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                    isActive
                      ? 'bg-teal-200/80 text-teal-950 dark:bg-teal-950 dark:text-[#5EEAD4] dark:border dark:border-teal-500/30'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Actions: Full Mode & Light/Dark Mode Toggle Switch */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleFullscreen}
          className={`p-2 rounded-xl border text-xs font-bold transition-all shadow-sm flex items-center justify-center ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-slate-200'
          }`}
          title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen (Full Mode)'}
          aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-cyan-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        <button
          onClick={toggleTheme}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all shadow-sm ${
            isDark
              ? 'bg-slate-900/90 border-slate-700/80 text-amber-300 hover:bg-slate-800 hover:border-slate-600'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-amber-600 shadow-slate-200'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle light or dark theme"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              <span className="hidden sm:inline font-mono text-[11px] text-amber-300">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline font-mono text-[11px] text-slate-700">Dark</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

