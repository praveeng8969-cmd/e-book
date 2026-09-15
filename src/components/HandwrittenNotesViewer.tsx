import React, { useState } from 'react';
import { thermodynamicsChapters } from '../data/chaptersData';
import { BookOpen, ChevronRight } from 'lucide-react';

interface HandwrittenNotesViewerProps {
  onSelectChapter: (chapterId: number) => void;
}

export const HandwrittenNotesViewer: React.FC<HandwrittenNotesViewerProps> = ({ onSelectChapter }) => {
  const [selectedChapter, setSelectedChapter] = useState<number>(1);

  const currentChapter = thermodynamicsChapters.find((c) => c.id === selectedChapter) || thermodynamicsChapters[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Index
            </h2>
          </div>
        </div>

        {/* Chapter Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {thermodynamicsChapters.map((chap) => (
            <button
              key={chap.id}
              onClick={() => setSelectedChapter(chap.id)}
              className={`p-3.5 rounded-xl border text-left transition-all space-y-1.5 ${
                selectedChapter === chap.id
                  ? 'chapter-card-active bg-teal-50/80 border-teal-500 shadow-xs dark:bg-teal-500/10 dark:border-teal-500/60 dark:shadow-md'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50'
              }`}
            >
              <div
                className={`text-xs font-bold font-mono ${
                  selectedChapter === chap.id
                    ? 'text-teal-700 dark:text-[#5EEAD4]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Chapter {chap.id}
              </div>
              <div
                className={`text-xs font-bold truncate ${
                  selectedChapter === chap.id
                    ? 'text-slate-950 dark:text-[#F8FAFC]'
                    : 'text-slate-800 dark:text-[#CBD5E1]'
                }`}
              >
                {chap.title.split(': ')[1]}
              </div>
              <div
                className={`text-[11px] line-clamp-1 ${
                  selectedChapter === chap.id
                    ? 'text-teal-900 dark:text-[#CBD5E1]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {chap.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chapter Detailed Manuscript Mapping */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentChapter.title}</h3>
          </div>
          <button
            onClick={() => onSelectChapter(currentChapter.id)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <span>Open Chapter</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Section Cards with Page Mapping */}
        <div className="space-y-4">
          {currentChapter.sections.map((sec, idx) => (
            <div
              key={sec.id}
              className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-5 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/40 transition-all space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                  {idx + 1}
                </span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sec.title}</h4>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{sec.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
