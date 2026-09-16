import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const JouleThomsonSim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [inletPressBar, setInletPressBar] = useState<number>(120); // bar
  const [initialTempK, setInitialTempK] = useState<number>(300);   // K

  const exitPressBar = 10; // bar fixed (atmospheric-ish)

  // Nitrogen inversion curve approximation
  const maxInversionTemp = 620; // K
  const maxInversionPress = 375; // bar
  const pRatio = Math.min(1, inletPressBar / maxInversionPress);
  const inversionTempAtP = useMemo(() => {
    return Math.max(0, maxInversionTemp * (1 - Math.pow(pRatio, 1.2)));
  }, [pRatio]);

  const isInsideDome = initialTempK < inversionTempAtP;

  // μ_JT approximation (K/bar)
  const muJT = useMemo(() => {
    if (isInsideDome) {
      // Cooling: positive μ_JT, magnitude proportional to distance from inversion
      return Math.round(((inversionTempAtP - initialTempK) / (maxInversionTemp)) * 0.5 * 100) / 100;
    } else {
      // Heating: negative μ_JT
      return -Math.round(((initialTempK - inversionTempAtP) / maxInversionTemp) * 0.3 * 100) / 100;
    }
  }, [isInsideDome, inversionTempAtP, initialTempK]);

  const deltaP = exitPressBar - inletPressBar;
  const deltaT = Math.round(muJT * deltaP * 10) / 10;
  const exitTemp = Math.round(initialTempK + deltaT);

  // Canvas throttling valve schematic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const ct = getCanvasTheme();
    ctx.fillStyle = ct.bg;
    ctx.fillRect(0, 0, W, H);

    const cy = H / 2 - 10;
    const cx = W / 2;

    // Pipe (left side — high pressure, wider)
    const pipeY = cy - 22;
    const pipeH = 44;

    // Left pipe (wider)
    ctx.fillStyle = ct.isLight ? '#e0f2fe' : '#0c4a6e';
    ctx.fillRect(30, pipeY, cx - 50, pipeH);
    ctx.strokeStyle = ct.containerBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, pipeY, cx - 50, pipeH);

    // Right pipe (same height but visually labeled as low pressure)
    ctx.fillStyle = ct.isLight ? '#fef2f2' : '#450a0a';
    if (isInsideDome) {
      ctx.fillStyle = ct.isLight ? '#ecfdf5' : '#052e16'; // cooling → green tint
    }
    ctx.fillRect(cx + 20, pipeY, W - cx - 50, pipeH);
    ctx.strokeStyle = ct.containerBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx + 20, pipeY, W - cx - 50, pipeH);

    // Throttle restriction (X shape)
    ctx.strokeStyle = ct.isLight ? '#334155' : '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 18, pipeY - 2);
    ctx.lineTo(cx + 18, pipeY + pipeH + 2);
    ctx.moveTo(cx + 18, pipeY - 2);
    ctx.lineTo(cx - 18, pipeY + pipeH + 2);
    ctx.stroke();

    // Valve label
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Throttle Valve', cx, pipeY - 10);

    // Flow arrow
    ctx.strokeStyle = ct.primary;
    ctx.fillStyle = ct.primary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, cy);
    ctx.lineTo(W - 40, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W - 40, cy);
    ctx.lineTo(W - 52, cy - 5);
    ctx.lineTo(W - 52, cy + 5);
    ctx.closePath();
    ctx.fill();

    // Inlet labels (left)
    ctx.fillStyle = ct.textMain;
    ctx.font = '12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`P₁ = ${inletPressBar} bar`, 40, pipeY + pipeH + 24);
    ctx.fillText(`T₁ = ${initialTempK} K`, 40, pipeY + pipeH + 42);

    // Outlet labels (right)
    ctx.textAlign = 'right';
    ctx.fillText(`P₂ = ${exitPressBar} bar`, W - 40, pipeY + pipeH + 24);
    ctx.fillStyle = isInsideDome ? '#059669' : '#ef4444';
    ctx.fillText(`T₂ = ${exitTemp} K`, W - 40, pipeY + pipeH + 42);
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(isInsideDome ? '(Cooling)' : '(Heating)', W - 40, pipeY + pipeH + 58);

    // h₁ = h₂ label
    ctx.fillStyle = '#14b8a6';
    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('h₁ = h₂ (Isenthalpic)', cx, pipeY + pipeH + 80);

    // μ_JT value
    ctx.fillStyle = ct.textMuted;
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText(`μ_JT ≈ ${muJT.toFixed(2)} K/bar   ΔT = ${deltaT > 0 ? '+' : ''}${deltaT} K`, cx, pipeY + pipeH + 98);

    ctx.textAlign = 'left';
  }, [inletPressBar, initialTempK, isDark, exitTemp, isInsideDome, muJT, deltaT]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Joule-Thomson Throttling
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={520} height={260} className="w-full max-w-xl h-auto" />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">P₁:</label>
          <input
            type="range" min="20" max="350" step="5" value={inletPressBar}
            onChange={(e) => setInletPressBar(Number(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-teal-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400 w-16 text-right">{inletPressBar} bar</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T₁:</label>
          <input
            type="range" min="100" max="700" step="5" value={initialTempK}
            onChange={(e) => setInitialTempK(Number(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-orange-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400 w-16 text-right">{initialTempK} K</span>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        The Joule-Thomson effect is the temperature change of a real gas when it is forced through a throttling valve at constant enthalpy.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center overflow-x-auto">
          <MathView math="\mu_{JT} = \left(\frac{\partial T}{\partial P}\right)_h" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="\mu_{JT}" /> — JT coefficient (K/bar)</span>
          <span><MathView math="T" /> — Temperature (K)</span>
          <span><MathView math="P" /> — Pressure (bar)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          For an ideal gas, μ_JT = 0 (no temperature change). h₁ = h₂ across the valve.
        </p>
      </div>
    </div>
  );
};
