import React, { useState } from 'react';
import { thermodynamicsChapters } from '../data/chaptersData';
import { FormulaCard } from './FormulaCard';
import { Search, Filter, BookOpen } from 'lucide-react';

export const FormulaCheatSheet: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<number | 'all'>('all');

  // Gather all formulas
  const allFormulas = thermodynamicsChapters.flatMap((chap) =>
    chap.quickFormulas.map((f, fIdx) => ({
      ...f,
      uid: `${chap.id}-${fIdx}`,
      chapterId: chap.id,
      chapterTitle: chap.title,
    }))
  );

  const filteredFormulas = allFormulas.filter((f) => {
    const matchesChapter = selectedChapterId === 'all' || f.chapterId === selectedChapterId;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesChapter;

    const matchesName = f.name.toLowerCase().includes(query);
    const matchesCond = f.conditions.toLowerCase().includes(query);
    const matchesLatex = f.latex.toLowerCase().includes(query);
    const matchesParams = f.parameters?.some(
      (p) =>
        p.symbol.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.unit.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );

    return matchesChapter && (matchesName || matchesCond || matchesLatex || matchesParams);
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Master Thermodynamics Formula Vault
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search bar */}
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search formulas (e.g. Boyle, Charles, Carnot, SFEE)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chapter Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
          <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <button
            onClick={() => setSelectedChapterId('all')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
              selectedChapterId === 'all'
                ? 'label-banner bg-teal-600 text-white dark:bg-[#14B8A6] dark:text-[#0F172A] border border-teal-600 dark:border-[#14B8A6] font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            All Chapters ({allFormulas.length})
          </button>
          {thermodynamicsChapters.map((chap) => (
            <button
              key={chap.id}
              onClick={() => setSelectedChapterId(chap.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedChapterId === chap.id
                  ? 'label-banner bg-teal-600 text-white dark:bg-[#14B8A6] dark:text-[#0F172A] border border-teal-600 dark:border-[#14B8A6] font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Ch {chap.id}
            </button>
          ))}
        </div>
      </div>

      {/* Formulas List (One by One) */}
      <div className="flex flex-col space-y-4">
        {filteredFormulas.map((formula) => (
          <FormulaCard
            key={formula.uid}
            formula={formula}
            badge={formula.chapterTitle.split(':')[0]}
          />
        ))}
      </div>

      {filteredFormulas.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400">
          No formulas matched "{searchQuery}". Try searching for another variable, unit, or keyword.
        </div>
      )}
    </div>
  );
};


