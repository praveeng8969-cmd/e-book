import React, { useState } from 'react';
import { QuickFormula } from '../types';
import { MathView, MathText } from './MathView';
import { Copy, Check, Layers, AlertCircle } from 'lucide-react';

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
  const displayTitle = rawTitle ? rawTitle.replace(/\*/g, '') : '';

  return (
    <div className="bg-slate-50/90 dark:bg-slate-950/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-xs dark:shadow-md hover:border-teal-500/40 transition-all flex flex-col justify-between group space-y-3.5 my-4 md:my-5">
      {/* Card Header: Formula Name & Copy Button */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/60">
        <div className="flex items-center gap-2.5 min-w-0">
          {badge && (
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/40 shrink-0">
              {badge}
            </span>
          )}
          {displayTitle && (
            <h4 className="text-[18px] md:text-[20px] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-[1.3]">
              <MathText text={displayTitle} />
            </h4>
          )}
        </div>
        <button
          onClick={() => handleCopy(formula.latex)}
          title="Copy formula LaTeX"
          className="min-h-[44px] min-w-[44px] p-2 rounded-xl text-slate-400 hover:text-teal-600 dark:hover:text-[#5EEAD4] hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors opacity-80 group-hover:opacity-100 flex items-center justify-center gap-1 text-sm font-mono shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-emerald-500 text-xs">Copied</span>
            </>
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Formula Body: Responsive 2-column or stacked layout without fixed height clipping */}
      <div className={`grid grid-cols-1 ${hasParams ? 'lg:grid-cols-12 gap-4 md:gap-5' : ''} items-start`}>
        {/* Left Side: Math Expression, Verbal Meaning & Condition */}
        <div className={`${hasParams ? 'lg:col-span-6 lg:pr-2' : 'w-full'} flex flex-col justify-center gap-3`}>
          <div className="text-center overflow-x-auto py-3 px-3 flex items-center justify-center min-h-[85px] bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <MathView math={formula.latex} block />
          </div>

          {formula.verbalMeaning && (
            <div className="text-[16px] text-slate-700 dark:text-slate-300 leading-[1.55] bg-slate-100/50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/40">
              <MathText text={formula.verbalMeaning} />
            </div>
          )}

          {formula.conditions && (
            <div className="text-sm text-slate-600 dark:text-slate-400 font-mono pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <span className="leading-snug">
                <strong className="text-slate-700 dark:text-slate-300">Condition: </strong>
                {formula.conditions}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Parameters & Units (Natural height, no max-h-56 clipping) */}
        {hasParams && (
          <div className="lg:col-span-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800/80 pt-3 lg:pt-0 lg:pl-5 flex flex-col justify-start">
            <div className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/50 text-teal-700 dark:text-teal-400 font-mono">
              <Layers className="w-3.5 h-3.5" />
              <span>Parameters & Physical Units</span>
            </div>

            {/* 3-Column Table with natural height */}
            <div className="overflow-x-auto">
              <div className="min-w-[260px] space-y-1">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {formula.parameters?.map((param, pIdx) => (
                    <div
                      key={pIdx}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-2 py-2 hover:bg-slate-100/60 dark:hover:bg-slate-900/60 rounded-lg transition-colors text-xs"
                    >
                      {/* Column 1: Symbol Chip */}
                      <div className="flex items-center justify-start shrink-0">
                        <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-300 bg-white dark:bg-slate-800/90 px-2 py-0.5 rounded-md border border-slate-200/90 dark:border-slate-700/80 shrink-0 inline-flex items-center justify-center min-w-[32px] text-center shadow-2xs">
                          <MathView math={param.symbol} />
                        </span>
                      </div>

                      {/* Column 2: Description Text */}
                      <div className="min-w-0 pr-1">
                        <span
                          className="font-medium text-slate-800 dark:text-slate-200 block"
                          title={param.description || param.name}
                        >
                          {param.name}
                        </span>
                      </div>

                      {/* Column 3: Unit Badge */}
                      <div className="flex justify-end shrink-0">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/40 whitespace-nowrap text-center">
                          <MathText text={param.unit} />
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
