import React, { useState, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

export const GasMixtureSim: React.FC = () => {
  const { isDark } = useTheme();

  const [moleFracA, setMoleFracA] = useState<number>(0.6); // y_A
  const moleFracB = Math.round((1 - moleFracA) * 100) / 100;

  const Ptotal = 200; // kPa fixed
  const pA = Math.round(moleFracA * Ptotal * 10) / 10;
  const pB = Math.round(moleFracB * Ptotal * 10) / 10;

  // Bar widths
  const maxBar = Ptotal;

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Dalton's Law — Gas Mixture Partial Pressures
      </h4>

      {/* Pressure bar diagram */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        {/* Total pressure bar (stacked) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-900 dark:text-white">P_total</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{Ptotal} kPa</span>
          </div>
          <div className="h-10 flex rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
            <div
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: `${(pA / maxBar) * 100}%`,
                backgroundColor: '#0284c7',
              }}
            >
              {moleFracA > 0.15 && (
                <span className="text-white font-bold text-xs">N₂: {pA} kPa</span>
              )}
            </div>
            <div
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: `${(pB / maxBar) * 100}%`,
                backgroundColor: '#d97706',
              }}
            >
              {moleFracB > 0.15 && (
                <span className="text-white font-bold text-xs">O₂: {pB} kPa</span>
              )}
            </div>
          </div>
        </div>

        {/* Individual bars */}
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-700 dark:text-sky-400">Gas A (N₂):&nbsp; y_A = {moleFracA.toFixed(2)}</span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400">p_A = {pA} kPa</span>
            </div>
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-200"
                style={{
                  width: `${(pA / maxBar) * 100}%`,
                  backgroundColor: '#0284c7',
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-700 dark:text-amber-400">Gas B (O₂):&nbsp; y_B = {moleFracB.toFixed(2)}</span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">p_B = {pB} kPa</span>
            </div>
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-200"
                style={{
                  width: `${(pB / maxBar) * 100}%`,
                  backgroundColor: '#d97706',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mole fraction slider */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          y_A (N₂):
        </label>
        <input
          type="range" min="0.05" max="0.95" step="0.05" value={moleFracA}
          onChange={(e) => setMoleFracA(parseFloat(e.target.value))}
          className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-sky-500 touch-pan-y"
        />
        <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400 w-12 text-right">
          {moleFracA.toFixed(2)}
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        Dalton's Law states that the total pressure of a gas mixture equals the sum of the partial pressures of its individual components.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center overflow-x-auto">
          <MathView math="P_{\text{total}} = \sum p_i = \sum y_i \cdot P" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="p_i" /> — Partial pressure (kPa)</span>
          <span><MathView math="y_i" /> — Mole fraction</span>
          <span><MathView math="P" /> — Total pressure (kPa)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Valid for ideal gas mixtures. Σy_i = 1.
        </p>
      </div>
    </div>
  );
};
