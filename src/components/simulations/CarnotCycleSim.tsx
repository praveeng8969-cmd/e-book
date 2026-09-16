import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const CarnotCycleSim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tHigh, setTHigh] = useState<number>(600); // K
  const [tLow, setTLow] = useState<number>(300);   // K

  const QH = 1000; // kJ fixed

  const efficiency = useMemo(() => 1 - tLow / tHigh, [tLow, tHigh]);
  const Wnet = useMemo(() => Math.round(QH * efficiency * 10) / 10, [efficiency]);
  const QL = useMemo(() => Math.round((QH - Wnet) * 10) / 10, [Wnet]);

  // Canvas heat engine schematic
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

    const cx = W / 2;

    // Hot reservoir
    const hotY = 35;
    const hotH = 45;
    ctx.fillStyle = isDark ? '#7f1d1d' : '#fef2f2';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - 90, hotY, 180, hotH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Hot Reservoir`, cx, hotY + 20);
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.fillText(`T_H = ${tHigh} K`, cx, hotY + 38);

    // Cold reservoir
    const coldY = H - 80;
    const coldH = 45;
    ctx.fillStyle = isDark ? '#0c4a6e' : '#eff6ff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - 90, coldY, 180, coldH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Cold Reservoir`, cx, coldY + 20);
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.fillText(`T_L = ${tLow} K`, cx, coldY + 38);

    // Engine box
    const engY = hotY + hotH + 45;
    const engH = 55;
    const engW = 130;
    ctx.fillStyle = ct.isLight ? '#f0fdfa' : '#1e293b';
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - engW / 2, engY, engW, engH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HEAT', cx, engY + 22);
    ctx.fillText('ENGINE', cx, engY + 40);

    // QH arrow (hot → engine)
    ctx.strokeStyle = '#ef4444';
    ctx.fillStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, hotY + hotH + 2);
    ctx.lineTo(cx, engY - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, engY - 2);
    ctx.lineTo(cx - 6, engY - 14);
    ctx.lineTo(cx + 6, engY - 14);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Q_H = ${QH} kJ`, cx + 12, hotY + hotH + 24);

    // QL arrow (engine → cold)
    ctx.strokeStyle = '#0284c7';
    ctx.fillStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, engY + engH + 2);
    ctx.lineTo(cx, coldY - 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, coldY - 2);
    ctx.lineTo(cx - 6, coldY - 14);
    ctx.lineTo(cx + 6, coldY - 14);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Q_L = ${QL} kJ`, cx + 12, engY + engH + 24);

    // W_net arrow (engine → right)
    ctx.strokeStyle = '#059669';
    ctx.fillStyle = '#059669';
    ctx.lineWidth = 3;
    const wy = engY + engH / 2;
    ctx.beginPath();
    ctx.moveTo(cx + engW / 2 + 2, wy);
    ctx.lineTo(cx + engW / 2 + 65, wy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + engW / 2 + 65, wy);
    ctx.lineTo(cx + engW / 2 + 55, wy - 6);
    ctx.lineTo(cx + engW / 2 + 55, wy + 6);
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 12px "Fira Code", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`W_net = ${Wnet} kJ`, cx + engW / 2 + 12, wy - 12);

    // Efficiency display
    ctx.fillStyle = '#14b8a6';
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`η = ${(efficiency * 100).toFixed(1)}%`, cx - engW / 2 - 12, wy + 5);

    ctx.textAlign = 'left';
  }, [tHigh, tLow, isDark, efficiency, Wnet, QL]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Carnot Heat Engine
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={480} height={340} className="w-full max-w-lg h-auto" />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T_H:</label>
          <input
            type="range" min="400" max="1200" step="10" value={tHigh}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTHigh(Math.max(val, tLow + 10));
            }}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-rose-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 w-16 text-right">{tHigh} K</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T_L:</label>
          <input
            type="range" min="200" max="600" step="10" value={tLow}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTLow(Math.min(val, tHigh - 10));
            }}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-sky-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400 w-16 text-right">{tLow} K</span>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        The Carnot cycle is the most efficient heat engine cycle possible between two temperature reservoirs. No real engine can exceed its efficiency.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="\eta_{\text{Carnot}} = 1 - \frac{T_L}{T_H}" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="\eta" /> — Efficiency (dimensionless)</span>
          <span><MathView math="T_H" /> — Hot reservoir (K)</span>
          <span><MathView math="T_L" /> — Cold reservoir (K)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          T must be in absolute units (Kelvin). η → 1 only when T_L → 0 K.
        </p>
      </div>
    </div>
  );
};
