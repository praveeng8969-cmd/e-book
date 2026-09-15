import React, { useState } from 'react';
import { SolvedProblem } from '../types';
import { MathView } from './MathView';
import { Calculator, CheckCircle2, RotateCcw, Sliders, ChevronRight, BookOpen } from 'lucide-react';

interface ProblemSolverProps {
  problems: SolvedProblem[];
}

export const ProblemSolver: React.FC<ProblemSolverProps> = ({ problems }) => {
  const [selectedProblemId, setSelectedProblemId] = useState<string>(problems[0]?.id || '');
  const problem = problems.find((p) => p.id === selectedProblemId) || problems[0];

  // Dynamic inputs state
  const [inputs, setInputs] = useState<Record<string, number>>(problem?.defaultInputs || {});

  // When selected problem changes, reset inputs
  const handleSelectProblem = (p: SolvedProblem) => {
    setSelectedProblemId(p.id);
    setInputs(p.defaultInputs);
  };

  const handleInputChange = (key: string, val: number) => {
    setInputs((prev) => ({ ...prev, [key]: val }));
  };

  const calculationResult = problem ? problem.calculate(inputs) : null;

  if (!problem) {
    return <div className="p-6 text-center text-slate-400">No solved problems available for this selection.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Problem Selector Pills */}
      <div className="flex flex-wrap gap-2">
        {problems.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectProblem(p)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              selectedProblemId === p.id
                ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950 dark:shadow-md dark:shadow-cyan-500/20 font-bold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="truncate max-w-[280px]">{p.title}</span>
          </button>
        ))}
      </div>

      {/* Problem Statement Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-mono text-cyan-700 dark:text-cyan-400 font-bold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-md">
              {problem.category}
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{problem.title}</h3>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Ref: {problem.notesReference}</span>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
          <strong className="text-cyan-800 dark:text-cyan-300 block mb-1 text-xs uppercase tracking-wide">Problem Statement:</strong>
          {problem.problemStatement}
        </div>

        {/* Dynamic Parameter Sliders */}
        <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              Adjust Problem Input Variables in Real-Time:
            </span>
            <button
              onClick={() => setInputs(problem.defaultInputs)}
              className="text-xs text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Notebook Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {problem.inputParams.map((param) => (
              <div key={param.key} className="space-y-1 bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/60">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{param.label}:</span>
                  <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                    {inputs[param.key] ?? param.defaultValue} {param.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={inputs[param.key] ?? param.defaultValue}
                  onChange={(e) => handleInputChange(param.key, Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600 dark:accent-cyan-500"
                />
                <p className="text-[10px] text-slate-500">{param.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Derivation & Solution */}
        {calculationResult && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Step-by-Step Mathematical Derivation:
            </h4>

            <div className="space-y-3">
              {calculationResult.steps.map((step, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                    <span className="w-5 h-5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 flex items-center justify-center text-[10px] font-mono font-bold">
                      {idx + 1}
                    </span>
                    <span>{step.title}</span>
                  </div>
                  <div className="py-1.5 px-3 bg-white/70 dark:bg-white/[0.06] backdrop-blur-xs rounded-lg border border-slate-200/80 dark:border-white/10 overflow-x-auto text-center shadow-xs">
                    <MathView math={step.latex} block />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.explanation}</p>
                </div>
              ))}
            </div>

            {/* Final Answer Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide block">Final Calculated Result:</span>
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">{calculationResult.finalAnswer}</span>
              </div>
              <div className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg shrink-0">
                Verified Solution
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
