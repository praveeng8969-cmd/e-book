import React from 'react';
import { Chapter } from '../types';
import { thermodynamicsChapters } from '../data/chaptersData';
import {
  Compass,
  Thermometer,
  Zap,
  RefreshCw,
  Network,
  ShieldAlert,
  ArrowRightLeft,
  Droplet,
  Cpu,
  BookOpen,
  ChevronRight,
  PanelLeftClose,
  X,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  selectedChapterId: number;
  onSelectChapter: (id: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  Compass: <Compass className="w-4 h-4" />,
  Thermometer: <Thermometer className="w-4 h-4" />,
  Zap: <Zap className="w-4 h-4" />,
  RefreshCw: <RefreshCw className="w-4 h-4" />,
  Network: <Network className="w-4 h-4" />,
  ShieldAlert: <ShieldAlert className="w-4 h-4" />,
  ArrowRightLeft: <ArrowRightLeft className="w-4 h-4" />,
  Droplet: <Droplet className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
};

export const Sidebar: React.FC<SidebarProps> = ({
  selectedChapterId,
  onSelectChapter,
  isOpen,
  onClose,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col z-50 transition-all duration-300 ease-in-out ${
          isOpen
            ? 'w-[85vw] sm:w-80 max-w-[20rem] translate-x-0 opacity-100 visible'
            : '-translate-x-full lg:translate-x-0 lg:w-0 lg:min-w-0 lg:max-w-0 lg:opacity-0 lg:invisible lg:overflow-hidden lg:border-r-0'
        }`}
      >
        {/* App Title / Brand & Hide Button */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 p-0.5 shadow-md shadow-teal-500/20 flex items-center justify-center text-slate-950 font-black shrink-0">
              <Flame className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-black tracking-wider text-slate-900 dark:text-white truncate">
                THERMODYNAMICS
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-900 transition-colors flex items-center justify-center"
            title="Hide Table of Contents"
            aria-label="Hide Table of Contents"
          >
            <PanelLeftClose className="w-5 h-5 hidden lg:block" />
            <X className="w-5 h-5 lg:hidden" />
          </button>
        </div>

        {/* Chapters Navigation List */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-1.5">
            Table of Contents
          </div>

          {thermodynamicsChapters.map((chap) => {
            const isSelected = selectedChapterId === chap.id;
            return (
              <button
                key={chap.id}
                onClick={() => {
                  onSelectChapter(chap.id);
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`w-full text-left p-2.5 sm:p-3 rounded-2xl transition-all flex items-start gap-3 group relative min-h-[48px] ${
                  isSelected
                    ? 'bg-teal-50 border border-teal-400 text-slate-950 shadow-sm dark:bg-[#134E4A]/50 dark:border-[#14B8A6] dark:text-[#F8FAFC] dark:shadow-lg dark:shadow-teal-950/40'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-[#F8FAFC] dark:hover:bg-slate-800/70'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-[#14B8A6] text-[#0F172A] font-bold shadow-md shadow-teal-500/20'
                      : 'bg-slate-100 border border-slate-200 text-slate-700 group-hover:text-teal-700 dark:bg-slate-800/90 dark:border-slate-700/80 dark:text-slate-300 dark:group-hover:text-[#5EEAD4]'
                  }`}
                >
                  {ICONS_MAP[chap.iconName] || <BookOpen className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider ${
                        isSelected ? 'text-teal-800 dark:text-[#5EEAD4]' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      CHAPTER {chap.id}
                    </span>
                  </div>
                  <div
                    className={`text-sm font-bold truncate mt-0.5 ${
                      isSelected
                        ? 'text-slate-950 dark:text-[#F8FAFC] font-extrabold'
                        : 'text-slate-800 dark:text-[#F8FAFC]'
                    }`}
                  >
                    {chap.title.split(': ')[1]}
                  </div>
                </div>

                {isSelected && (
                  <ChevronRight className="w-4 h-4 text-teal-700 dark:text-[#5EEAD4] shrink-0 self-center" />
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};
