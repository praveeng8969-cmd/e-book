import React, { useState, useEffect, useRef } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export const ThermalEquilibriumSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tempA0, setTempA0] = useState<number>(400); // K initial
  const [tempB0, setTempB0] = useState<number>(250); // K initial
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0 to 1

  // Equal masses and materials for simplicity
  const Teq = (tempA0 + tempB0) / 2;
  const currentTA = isConnected ? tempA0 + (Teq - tempA0) * progress : tempA0;
  const currentTB = isConnected ? tempB0 + (Teq - tempB0) * progress : tempB0;

  // Animate convergence
  useEffect(() => {
    if (!isConnected || !shouldAnimate) return;
    let animId: number;
    let p = progress;

    const tick = () => {
      if (p < 0.99) {
        p += 0.008;
        setProgress(Math.min(p, 1));
        animId = requestAnimationFrame(tick);
      } else {
        setProgress(1);
      }
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isConnected, shouldAnimate]);

  // Reset on slider change
  useEffect(() => {
    setIsConnected(false);
    setProgress(0);
  }, [tempA0, tempB0]);

  // Canvas drawing
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

    const blockW = 130;
    const blockH = 100;
    const gap = isConnected ? 0 : 40;
    const totalW = blockW * 2 + gap;
    const startX = (W - totalW) / 2;
    const startY = (H - blockH) / 2;

    // Temperature to color
    const tempColor = (t: number) => {
      const frac = Math.min(1, Math.max(0, (t - 200) / 400)); // 200K–600K range
      const r = Math.round(60 + frac * 195);
      const g = Math.round(120 - frac * 70);
      const b = Math.round(240 - frac * 190);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Block A (left)
    ctx.fillStyle = tempColor(currentTA);
    ctx.fillRect(startX, startY, blockW, blockH);
    ctx.strokeStyle = ct.containerBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, blockW, blockH);

    // Block B (right)
    ctx.fillStyle = tempColor(currentTB);
    ctx.fillRect(startX + blockW + gap, startY, blockW, blockH);
    ctx.strokeRect(startX + blockW + gap, startY, blockW, blockH);

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`A`, startX + blockW / 2, startY + 30);
    ctx.fillText(`${Math.round(currentTA)} K`, startX + blockW / 2, startY + 55);
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentTA > Teq + 1 ? '(Hot)' : currentTA < Teq - 1 ? '(Cold)' : '(Eq)', startX + blockW / 2, startY + 72);

    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.fillText(`B`, startX + blockW + gap + blockW / 2, startY + 30);
    ctx.fillText(`${Math.round(currentTB)} K`, startX + blockW + gap + blockW / 2, startY + 55);
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(currentTB > Teq + 1 ? '(Hot)' : currentTB < Teq - 1 ? '(Cold)' : '(Eq)', startX + blockW + gap + blockW / 2, startY + 72);

    // Heat flow arrow when connected and not at equilibrium
    if (isConnected && progress < 0.98) {
      const arrowY = startY + blockH / 2;
      const fromHot = tempA0 > tempB0;
      const ax1 = fromHot ? startX + blockW + 5 : startX + blockW + gap - 5;
      const ax2 = fromHot ? startX + blockW + gap - 5 : startX + blockW + 5;

      ctx.strokeStyle = ct.heat;
      ctx.fillStyle = ct.heat;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax1, arrowY);
      ctx.lineTo(ax2, arrowY);
      ctx.stroke();

      const angle = Math.atan2(0, ax2 - ax1);
      ctx.beginPath();
      ctx.moveTo(ax2, arrowY);
      ctx.lineTo(ax2 - 10 * Math.cos(angle - 0.4), arrowY - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(ax2 - 10 * Math.cos(angle + 0.4), arrowY - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Q →', (ax1 + ax2) / 2, arrowY - 12);
    }

    // Equilibrium indicator
    if (isConnected && progress >= 0.98) {
      ctx.fillStyle = ct.success;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Thermal Equilibrium: T_eq = ${Math.round(Teq)} K`, W / 2, startY + blockH + 30);
    }

    // Title on canvas
    ctx.fillStyle = ct.textMuted;
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(isConnected ? 'Thermal contact — heat flows until T_A = T_B' : 'Two bodies at different temperatures', 12, 18);
    ctx.textAlign = 'left';
  }, [currentTA, currentTB, isConnected, progress, isDark, Teq, tempA0, tempB0]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Zeroth Law — Thermal Equilibrium
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={480} height={220} className="w-full max-w-lg h-auto" />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-16 shrink-0">T_A:</label>
          <input
            type="range" min="200" max="600" step="5" value={tempA0}
            onChange={(e) => setTempA0(Number(e.target.value))}
            className="flex-1 min-w-[120px] h-8 bg-transparent appearance-none cursor-pointer accent-rose-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 w-16 text-right">{tempA0} K</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-16 shrink-0">T_B:</label>
          <input
            type="range" min="200" max="600" step="5" value={tempB0}
            onChange={(e) => setTempB0(Number(e.target.value))}
            className="flex-1 min-w-[120px] h-8 bg-transparent appearance-none cursor-pointer accent-sky-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400 w-16 text-right">{tempB0} K</span>
        </div>
        <button
          onClick={() => { setProgress(0); setIsConnected(true); }}
          disabled={isConnected}
          className="min-h-[44px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isConnected ? (progress >= 0.98 ? `Equilibrium at ${Math.round(Teq)} K` : 'Reaching equilibrium…') : 'Connect Bodies'}
        </button>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        When two bodies at different temperatures are placed in thermal contact, heat flows from the hotter to the cooler body until both reach the same equilibrium temperature.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="T_{eq} = \frac{m_A c_A T_A + m_B c_B T_B}{m_A c_A + m_B c_B}" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="T_{eq}" /> — Equilibrium temp (K)</span>
          <span><MathView math="m" /> — Mass (kg)</span>
          <span><MathView math="c" /> — Specific heat (kJ/kg·K)</span>
          <span><MathView math="T_A, T_B" /> — Initial temps (K)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          For equal masses and materials: <MathView math="T_{eq} = (T_A + T_B)/2" />
        </p>
      </div>
    </div>
  );
};
