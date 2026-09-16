import React from 'react';
import { Eye, HelpCircle, GraduationCap, CheckCircle } from 'lucide-react';
import { MathText, MathView } from './MathView';

export interface ObservationCalloutProps {
  observe: string;
  reason: string;
  takeaway: string;
  governingEquation?: string;
  stateValues?: Array<{ label: string; value: string; unit?: string; highlight?: boolean }>;
  className?: string;
}

export const ObservationCallout: React.FC<ObservationCalloutProps> = ({
  observe,
  reason,
  takeaway,
  governingEquation,
  stateValues,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-3.5 sm:p-4 md:p-5 shadow-xs space-y-3.5 my-4 md:my-6 ${className}`}
    >
      {/* Optional Governing Equation & Live State Values Row */}
      {(governingEquation || (stateValues && stateValues.length > 0)) && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/60">
          {governingEquation && (
            <div className="flex items-center gap-2 overflow-x-auto text-sm font-mono text-slate-700 dark:text-slate-300">
              <span className="font-bold text-teal-600 dark:text-teal-400 shrink-0">Governing Law:</span>
              <div className="bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 shrink-0">
                <MathView math={governingEquation} />
              </div>
            </div>
          )}

          {stateValues && stateValues.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {stateValues.map((sv, idx) => (
                <div
                  key={idx}
                  className={`px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 border ${
                    sv.highlight
                      ? 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-700'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <span className="text-slate-500 dark:text-slate-400">{sv.label}:</span>
                  <span className="font-bold">{sv.value}</span>
                  {sv.unit && <span className="text-xs text-slate-500">{sv.unit}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3 Pedagogical Pillars: Observe -> Reason -> Exam Takeaway (16px Explanation Text) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pillar 1: Observe */}
        <div className="p-3.5 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-sky-800 dark:text-sky-300">
            <Eye className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="uppercase tracking-wider">Observe</span>
          </div>
          <div className="text-[16px] text-slate-700 dark:text-slate-300 leading-[1.55]">
            <MathText text={observe} />
          </div>
        </div>

        {/* Pillar 2: Reason */}
        <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-indigo-800 dark:text-indigo-300">
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="uppercase tracking-wider">Reason</span>
          </div>
          <div className="text-[16px] text-slate-700 dark:text-slate-300 leading-[1.55]">
            <MathText text={reason} />
          </div>
        </div>

        {/* Pillar 3: Exam Takeaway */}
        <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-bold text-teal-800 dark:text-teal-300">
            <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="uppercase tracking-wider">Exam Takeaway</span>
          </div>
          <div className="text-[16px] text-slate-700 dark:text-slate-300 leading-[1.55]">
            <MathText text={takeaway} />
          </div>
        </div>
      </div>
    </div>
  );
};
