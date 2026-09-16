import React, { useState, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

export const EnergyBalanceSim: React.FC = () => {
  const { isDark } = useTheme();

  const [heatQ, setHeatQ] = useState<number>(250); // kJ
  const [workW, setWorkW] = useState<number>(100); // kJ

  const deltaU = useMemo(() => Math.round((heatQ - workW) * 10) / 10, [heatQ, workW]);

  // Bar scaling
  const maxVal = Math.max(Math.abs(heatQ), Math.abs(workW), Math.abs(deltaU), 50);

  const barStyle = (val: number, positiveColor: string, negativeColor: string) => {
    const pct = Math.min(100, (Math.abs(val) / maxVal) * 100);
    const color = val >= 0 ? positiveColor : negativeColor;
    return { width: `${Math.max(4, pct)}%`, backgroundColor: color };
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        First Law Energy Balance
      </h4>

      {/* Bar diagram */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        {/* Q bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Heat (Q)</span>
            <span className="font-mono font-bold" style={{ color: heatQ >= 0 ? '#e11d48' : '#0284c7' }}>
              {heatQ > 0 ? '+' : ''}{heatQ} kJ
            </span>
          </div>
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
            <div className="h-full rounded-lg transition-all duration-200" style={barStyle(heatQ, '#e11d48', '#0284c7')} />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {heatQ > 0 ? 'Heat added to system' : heatQ < 0 ? 'Heat rejected by system' : 'Adiabatic (Q = 0)'}
          </span>
        </div>

        {/* W bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Work (W)</span>
            <span className="font-mono font-bold" style={{ color: workW >= 0 ? '#059669' : '#d97706' }}>
              {workW > 0 ? '+' : ''}{workW} kJ
            </span>
          </div>
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
            <div className="h-full rounded-lg transition-all duration-200" style={barStyle(workW, '#059669', '#d97706')} />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {workW > 0 ? 'Work done by system' : workW < 0 ? 'Work done on system' : 'Isochoric (W = 0)'}
          </span>
        </div>

        {/* ΔU bar */}
        <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-900 dark:text-white">ΔU = Q − W</span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {deltaU > 0 ? '+' : ''}{deltaU} kJ
            </span>
          </div>
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
            <div className="h-full rounded-lg transition-all duration-200" style={barStyle(deltaU, '#6366f1', '#818cf8')} />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {deltaU > 0 ? 'Internal energy increased' : deltaU < 0 ? 'Internal energy decreased' : 'ΔU = 0 (isothermal ideal gas)'}
          </span>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 shrink-0">Q:</label>
          <input
            type="range" min="-500" max="500" step="10" value={heatQ}
            onChange={(e) => setHeatQ(Number(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-rose-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 w-20 text-right">{heatQ} kJ</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-12 shrink-0">W:</label>
          <input
            type="range" min="-500" max="500" step="10" value={workW}
            onChange={(e) => setWorkW(Number(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-emerald-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 w-20 text-right">{workW} kJ</span>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        The First Law of Thermodynamics states that energy is conserved: the heat added to a closed system minus the work done by it equals the change in internal energy.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="\Delta U = Q - W" block />
        </div>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="\Delta U" /> — Internal energy (kJ)</span>
          <span><MathView math="Q" /> — Heat transfer (kJ)</span>
          <span><MathView math="W" /> — Work (kJ)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Sign convention: Q &gt; 0 = heat added; W &gt; 0 = work done by gas.
        </p>
      </div>
    </div>
  );
};
