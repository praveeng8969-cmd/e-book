import React, { useState, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

export const ExergyDeadStateSim: React.FC = () => {
  const { isDark } = useTheme();

  const [tempSource, setTempSource] = useState<number>(800);    // K
  const [tempDeadState, setTempDeadState] = useState<number>(298); // K (T₀)

  const Q = 1000; // kJ fixed

  const carnotFactor = useMemo(() => {
    if (tempSource <= tempDeadState) return 0;
    return 1 - tempDeadState / tempSource;
  }, [tempSource, tempDeadState]);

  const exergy = useMemo(() => Math.round(Q * carnotFactor * 10) / 10, [carnotFactor]);
  const anergy = useMemo(() => Math.round((Q - exergy) * 10) / 10, [exergy]);

  const exergyPct = Math.round((exergy / Q) * 100);
  const anergyPct = 100 - exergyPct;

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Exergy & Dead State — Available vs Unavailable Energy
      </h4>

      {/* Stacked bar */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Total Energy Q = {Q} kJ
        </div>

        {/* Bar */}
        <div className="h-12 sm:h-14 flex rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
          <div
            className="flex items-center justify-center transition-all duration-300"
            style={{
              width: `${Math.max(5, exergyPct)}%`,
              backgroundColor: '#10b981',
            }}
          >
            {exergyPct > 15 && (
              <span className="text-white font-bold text-xs sm:text-sm">
                Exergy {exergyPct}%
              </span>
            )}
          </div>
          <div
            className="flex items-center justify-center transition-all duration-300"
            style={{
              width: `${Math.max(5, anergyPct)}%`,
              backgroundColor: isDark ? '#475569' : '#94a3b8',
            }}
          >
            {anergyPct > 15 && (
              <span className="text-white font-bold text-xs sm:text-sm">
                Anergy {anergyPct}%
              </span>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="flex justify-between text-sm font-mono">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            Exergy = {exergy} kJ
          </span>
          <span className="text-slate-500 dark:text-slate-400 font-bold">
            Anergy = {anergy} kJ
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T:</label>
          <input
            type="range" min="350" max="1500" step="10" value={tempSource}
            onChange={(e) => setTempSource(Number(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-emerald-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 w-16 text-right">{tempSource} K</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T₀:</label>
          <input
            type="range" min="250" max="350" step="1" value={tempDeadState}
            onChange={(e) => setTempDeadState(Number(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-slate-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400 w-16 text-right">{tempDeadState} K</span>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        Exergy is the maximum useful work obtainable from a system as it comes to equilibrium with its surroundings at the dead state T₀. The remainder is anergy — energy that cannot be converted to work.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="\text{Exergy} = Q\left(1 - \frac{T_0}{T}\right)" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="Q" /> — Total energy (kJ)</span>
          <span><MathView math="T" /> — Source temp (K)</span>
          <span><MathView math="T_0" /> — Dead state temp (K)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          At the dead state (T = T₀), exergy = 0.
        </p>
      </div>
    </div>
  );
};
