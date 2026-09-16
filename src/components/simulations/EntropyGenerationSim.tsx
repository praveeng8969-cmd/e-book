import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const EntropyGenerationSim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [tempSource, setTempSource] = useState<number>(600); // K (T_H)
  const [tempSink, setTempSink] = useState<number>(300);     // K (T_L)

  const Q = 1000; // kJ fixed

  const deltaSSource = useMemo(() => -Q / tempSource, [tempSource]); // kJ/K
  const deltaSSink = useMemo(() => Q / tempSink, [tempSink]);       // kJ/K
  const sGen = useMemo(() => Math.round((deltaSSink + deltaSSource) * 1000) / 1000, [deltaSSource, deltaSSink]);

  // Canvas diagram
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

    const cy = H / 2;

    // Source box (left)
    const srcX = 50;
    const boxW = 130;
    const boxH = 90;
    ctx.fillStyle = isDark ? '#7f1d1d' : '#fef2f2';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(srcX, cy - boxH / 2, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hot Source', srcX + boxW / 2, cy - 16);
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.fillText(`T_H = ${tempSource} K`, srcX + boxW / 2, cy + 4);
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText(`ΔS = ${deltaSSource.toFixed(2)} kJ/K`, srcX + boxW / 2, cy + 24);

    // Sink box (right)
    const sinkX = W - 50 - boxW;
    ctx.fillStyle = isDark ? '#0c4a6e' : '#eff6ff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(sinkX, cy - boxH / 2, boxW, boxH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cold Sink', sinkX + boxW / 2, cy - 16);
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.fillText(`T_L = ${tempSink} K`, sinkX + boxW / 2, cy + 4);
    ctx.font = '11px "Fira Code", monospace';
    ctx.fillText(`ΔS = +${deltaSSink.toFixed(2)} kJ/K`, sinkX + boxW / 2, cy + 24);

    // Heat flow arrow (source → sink)
    const arrowY = cy;
    const ax1 = srcX + boxW + 8;
    const ax2 = sinkX - 8;
    ctx.strokeStyle = ct.heat;
    ctx.fillStyle = ct.heat;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax1, arrowY);
    ctx.lineTo(ax2, arrowY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ax2, arrowY);
    ctx.lineTo(ax2 - 12, arrowY - 6);
    ctx.lineTo(ax2 - 12, arrowY + 6);
    ctx.closePath();
    ctx.fill();

    // Q label on arrow
    ctx.font = 'bold 13px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Q = ${Q} kJ`, (ax1 + ax2) / 2, arrowY - 14);

    // S_gen result below
    ctx.fillStyle = sGen > 0.001 ? '#d97706' : ct.success;
    ctx.font = 'bold 14px "Fira Code", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`S_gen = ${sGen.toFixed(3)} kJ/K`, W / 2, H - 28);

    ctx.fillStyle = ct.textMuted;
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      sGen > 0.001 ? '(Irreversible: S_gen > 0)' : '(Reversible limit: S_gen → 0)',
      W / 2, H - 12
    );

    ctx.textAlign = 'left';
  }, [tempSource, tempSink, isDark, deltaSSource, deltaSSink, sGen]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Entropy Generation in Heat Transfer
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={520} height={240} className="w-full max-w-xl h-auto" />
      </div>

      {/* Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T_H:</label>
          <input
            type="range" min="350" max="1200" step="10" value={tempSource}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTempSource(Math.max(val, tempSink + 10));
            }}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-rose-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 w-16 text-right">{tempSource} K</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 w-10 shrink-0">T_L:</label>
          <input
            type="range" min="200" max="600" step="10" value={tempSink}
            onChange={(e) => {
              const val = Number(e.target.value);
              setTempSink(Math.min(val, tempSource - 10));
            }}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-sky-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400 w-16 text-right">{tempSink} K</span>
        </div>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        When heat flows across a finite temperature difference, entropy is generated in the universe. This makes the process irreversible.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center overflow-x-auto">
          <MathView math="S_{\text{gen}} = Q\left(\frac{1}{T_L} - \frac{1}{T_H}\right) \geq 0" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="S_{\text{gen}}" /> — Entropy generated (kJ/K)</span>
          <span><MathView math="Q" /> — Heat transferred (kJ)</span>
          <span><MathView math="T_H, T_L" /> — Temperatures (K)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          S_gen = 0 only for reversible processes (T_H → T_L).
        </p>
      </div>
    </div>
  );
};
