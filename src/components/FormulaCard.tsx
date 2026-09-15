import React, { useState } from 'react';
import { QuickFormula } from '../types';
import { MathView } from './MathView';
import { Copy, Check, Layers } from 'lucide-react';

interface FormulaCardProps {
  formula: QuickFormula;
  title?: string;
  badge?: string;
  compact?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  formula,
  title,
  badge,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (latex: string) => {
    navigator.clipboard.writeText(latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasParams = formula.parameters && formula.parameters.length > 0;
  const rawTitle = title || formula.name;
  const displayTitle = rawTitle ? rawTitle.replace(/[*$]/g, '') : '';

  return (
    <div className="bg-slate-50/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs dark:shadow-md hover:border-cyan-500/40 transition-all flex flex-col justify-between group space-y-4 my-4">
      {/* Card Header: Formula Name & Copy Button */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/70 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          {badge && (
            <span className="text-[10px] font-mono label-banner px-2 py-0.5 rounded-full font-bold border border-cyan-200 dark:border-teal-500 shrink-0">
              {badge}
            </span>
          )}
          {displayTitle && (
            <h4 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight truncate">
              {displayTitle}
            </h4>
          )}
        </div>
        <button
          onClick={() => handleCopy(formula.latex)}
          title="Copy formula LaTeX"
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-[#5EEAD4] hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors opacity-80 group-hover:opacity-100 flex items-center gap-1 text-xs font-mono shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500 text-[10px]">Copied</span>
            </>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Unified Formula Body: Single cohesive layout without nested card boxes */}
      <div className={`grid grid-cols-1 ${hasParams ? 'md:grid-cols-12 gap-5' : ''} items-center`}>
        {/* Left Side: Math Expression & Condition */}
        <div className={`${hasParams ? 'md:col-span-6 md:pr-2' : 'w-full'} flex flex-col justify-center gap-3`}>
          <div className="text-center overflow-x-auto py-3.5 px-4 flex items-center justify-center min-h-[85px] bg-white/70 dark:bg-white/[0.06] backdrop-blur-xs rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs">
            <MathView math={formula.latex} block />
          </div>

          {formula.conditions && (
            <div className="text-xs text-slate-600 dark:text-slate-400 font-mono pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
              <span className="accent-heading font-bold shrink-0">Condition:</span>
              <span className="leading-snug text-slate-700 dark:text-slate-300">{formula.conditions}</span>
            </div>
          )}
        </div>

        {/* Right Side: Parameters & Units (Unified 3-Column Grid Table) */}
        {hasParams && (
          <div className="md:col-span-6 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800/80 pt-3 md:pt-0 md:pl-5 flex flex-col justify-start">
            <div className="text-[11px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/50 accent-heading">
              <Layers className="w-3.5 h-3.5" />
              <span>Parameters & Units</span>
            </div>

            {/* 3-Column Aligned Grid Table */}
            <div className="overflow-x-auto">
              <div className="min-w-[260px] overflow-y-auto max-h-56 pr-1 space-y-1">
                {/* Table Data Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {formula.parameters?.map((param, pIdx) => (
                    <div
                      key={pIdx}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-1.5 py-1.5 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 rounded-lg transition-colors text-xs"
                    >
                      {/* Column 1: Symbol Chip */}
                      <div className="flex items-center justify-start shrink-0">
                        <span className="font-mono font-bold text-xs text-cyan-700 dark:text-cyan-300 bg-white/70 dark:bg-white/[0.08] backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-slate-200/80 dark:border-white/10 shrink-0 inline-flex items-center justify-center min-w-[30px] text-center shadow-2xs">
                          <MathView math={param.symbol} inline />
                        </span>
                      </div>

                      {/* Column 2: Description Text */}
                      <div className="min-w-0 pr-1">
                        <span
                          className="font-medium text-slate-800 dark:text-slate-200 block truncate"
                          title={param.description || param.name}
                        >
                          {param.name}
                        </span>
                      </div>

                      {/* Column 3: Unit Badge */}
                      <div className="flex justify-end shrink-0">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/40 whitespace-nowrap text-center">
                          {param.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
