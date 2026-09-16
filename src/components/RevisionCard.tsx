import React from 'react';
import { MathView, MathText } from './MathView';
import { BookOpen, CheckCircle2, AlertCircle, Sparkles, Layers } from 'lucide-react';

export interface SymbolDefinition {
  symbol: string;
  name: string;
  unit: string;
  description?: string;
}

export interface SpecialCase {
  label: string;
  condition: string;
  result: string;
}

export interface RevisionCardProps {
  title: string;
  badge?: string;
  explanation: string;
  equation: string;
  secondaryEquation?: string;
  symbols?: SymbolDefinition[];
  takeaway: string | React.ReactNode;
  validity?: string;
  specialCases?: SpecialCase[];
  variant?: 'teal' | 'cyan' | 'amber' | 'rose' | 'indigo' | 'emerald';
  className?: string;
}

export const RevisionCard: React.FC<RevisionCardProps> = ({
  title,
  badge = 'QUICK REVISION',
  explanation,
  equation,
  secondaryEquation,
  symbols,
  takeaway,
  validity,
  specialCases,
  variant = 'teal',
  className = '',
}) => {
  const variantStyles = {
    teal: {
      border: 'border-teal-500/30 dark:border-teal-500/30',
      badge: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/40',
      bgGlow: 'bg-teal-500/5 dark:bg-teal-950/20',
      headerIcon: 'text-teal-600 dark:text-teal-400',
      eqBox: 'bg-white dark:bg-slate-900/90 border-teal-500/20 dark:border-teal-500/30',
      accent: 'text-teal-700 dark:text-teal-300',
    },
    cyan: {
      border: 'border-cyan-500/30 dark:border-cyan-500/30',
      badge: 'bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/40',
      bgGlow: 'bg-cyan-500/5 dark:bg-cyan-950/20',
      headerIcon: 'text-cyan-600 dark:text-cyan-400',
      eqBox: 'bg-white dark:bg-slate-900/90 border-cyan-500/20 dark:border-cyan-500/30',
      accent: 'text-cyan-700 dark:text-cyan-300',
    },
    amber: {
      border: 'border-amber-500/30 dark:border-amber-500/30',
      badge: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
      bgGlow: 'bg-amber-500/5 dark:bg-amber-950/20',
      headerIcon: 'text-amber-600 dark:text-amber-400',
      eqBox: 'bg-white dark:bg-slate-900/90 border-amber-500/20 dark:border-amber-500/30',
      accent: 'text-amber-700 dark:text-amber-300',
    },
    rose: {
      border: 'border-rose-500/30 dark:border-rose-500/30',
      badge: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/40',
      bgGlow: 'bg-rose-500/5 dark:bg-rose-950/20',
      headerIcon: 'text-rose-600 dark:text-rose-400',
      eqBox: 'bg-white dark:bg-slate-900/90 border-rose-500/20 dark:border-rose-500/30',
      accent: 'text-rose-700 dark:text-rose-300',
    },
    indigo: {
      border: 'border-indigo-500/30 dark:border-indigo-500/30',
      badge: 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/40',
      bgGlow: 'bg-indigo-500/5 dark:bg-indigo-950/20',
      headerIcon: 'text-indigo-600 dark:text-indigo-400',
      eqBox: 'bg-white dark:bg-slate-900/90 border-indigo-500/20 dark:border-indigo-500/30',
      accent: 'text-indigo-700 dark:text-indigo-300',
    },
    emerald: {
      border: 'border-emerald-500/30 dark:border-emerald-500/30',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
      bgGlow: 'bg-emerald-500/5 dark:bg-emerald-950/20',
      headerIcon: 'text-emerald-600 dark:text-emerald-400',
      eqBox: 'bg-white dark:bg-slate-900/90 border-emerald-500/20 dark:border-emerald-500/30',
      accent: 'text-emerald-700 dark:text-emerald-300',
    },
  }[variant];

  return (
    <div
      className={`rounded-2xl border ${variantStyles.border} ${variantStyles.bgGlow} p-3.5 sm:p-4 md:p-5 shadow-xs dark:shadow-md space-y-3.5 my-4 md:my-6 transition-all ${className}`}
    >
      {/* 1. Concept Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${variantStyles.badge} shrink-0`}>
            {badge}
          </span>
          <h4 className="text-[18px] md:text-[20px] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.3] flex items-center gap-1.5">
            <Sparkles className={`w-4 h-4 ${variantStyles.headerIcon} shrink-0`} />
            <MathText text={title} />
          </h4>
        </div>
      </div>

      {/* 2. Short Explanation (Standard 16px Body Text) */}
      <div className="text-[16px] text-slate-700 dark:text-slate-300 leading-[1.55]">
        <MathText text={explanation} />
      </div>

      {/* 3. Clearly Separated Equation (Display container with horizontal scroll) */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
          Governing Formulation
        </div>
        <div
          className={`p-3.5 sm:p-4 rounded-xl border ${variantStyles.eqBox} text-center overflow-x-auto shadow-xs min-h-[64px] flex items-center justify-center`}
        >
          <MathView math={equation} block />
        </div>

        {secondaryEquation && (
          <div
            className={`p-2.5 sm:p-3 rounded-xl border ${variantStyles.eqBox} text-center overflow-x-auto shadow-xs text-sm`}
          >
            <MathView math={secondaryEquation} block />
          </div>
        )}
      </div>

      {/* Special Cases / Limiting Conditions if provided */}
      {specialCases && specialCases.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Key Limiting Cases & Behavioral Criteria
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {specialCases.map((sc, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 space-y-1 shadow-2xs"
              >
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span className="text-teal-600 dark:text-teal-400 font-mono font-extrabold">•</span>
                  <span>{sc.label}</span>
                </div>
                <div className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-950/50 px-2 py-1 rounded-md overflow-x-auto">
                  <MathView math={sc.condition} />
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 pt-0.5 leading-relaxed">
                  <MathText text={sc.result} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Symbol Definitions & Units */}
      {symbols && symbols.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>Parameters & Physical Units</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {symbols.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/60 text-sm"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 shrink-0 border border-slate-200 dark:border-slate-700/80">
                    <MathView math={item.symbol} />
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate" title={item.description || item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="font-mono text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/40 px-1.5 py-0.5 rounded shrink-0">
                  <MathText text={item.unit} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Key Takeaway & Condition of Validity (Standard 16px Revision Notes) */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-teal-500/10 dark:bg-teal-500/10 border border-teal-500/20 text-[16px]">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-1" />
          <div className="text-slate-800 dark:text-slate-200 leading-[1.55]">
            <span className="font-bold text-teal-900 dark:text-teal-300 mr-1.5">Key Exam Takeaway:</span>
            <MathText text={typeof takeaway === 'string' ? takeaway : ''} />
            {typeof takeaway !== 'string' && takeaway}
          </div>
        </div>

        {validity && (
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400 font-mono px-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <span className="font-bold text-slate-700 dark:text-slate-300">Condition of Validity: </span>
              <MathText text={validity} />
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
