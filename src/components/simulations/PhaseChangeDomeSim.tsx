import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const PhaseChangeDomeSim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pressureBar, setPressureBar] = useState<number>(10); // bar

  // Saturation temperature (water approximation): Tsat ~ 99.6 + 36.5 * ln(P)
  const tSatC = useMemo(() => Math.round((99.6 + 36.5 * Math.log(pressureBar)) * 10) / 10, [pressureBar]);
  const tSatK = tSatC + 273.15;

  // Saturated properties
  const vf = 0.00104; // m³/kg (approx)
  const vg = useMemo(() => Math.max(0.005, (0.4615 * tSatK) / (pressureBar * 100)), [tSatK, pressureBar]);

  // Critical point
  const Tc = 374; // °C
  const Pc = 220.6; // bar

  // Canvas T-v dome
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

    // Plot area
    const padL = 65, padR = 20, padT = 25, padB = 50;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Axes: T (°C) vertical, v (m³/kg) horizontal (log scale)
    const vMinLog = Math.log10(0.0005);
    const vMaxLog = Math.log10(5.0);
    const tMin = 0;
    const tMax = 450;

    const toX = (v: number) => padL + ((Math.log10(Math.max(0.0005, v)) - vMinLog) / (vMaxLog - vMinLog)) * plotW;
    const toY = (t: number) => padT + plotH - ((t - tMin) / (tMax - tMin)) * plotH;

    // Grid
    ctx.strokeStyle = ct.gridLine;
    ctx.lineWidth = 1;
    for (let t = 50; t < tMax; t += 50) {
      const y = toY(t);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
    }
    const vTicks = [0.001, 0.01, 0.1, 1.0];
    for (const v of vTicks) {
      const x = toX(v);
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = ct.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(W - padR, padT + plotH);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = ct.axisLabel;
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Specific Volume v (m³/kg) — log scale', padL + plotW / 2, H - 8);

    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Temperature T (°C)', 0, 0);
    ctx.restore();

    // Tick labels
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = ct.textMuted;
    ctx.textAlign = 'center';
    for (const v of vTicks) {
      ctx.fillText(v >= 1 ? v.toString() : v.toFixed(3), toX(v), padT + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let t = 0; t <= tMax; t += 100) {
      ctx.fillText(t.toString(), padL - 6, toY(t) + 4);
    }

    // Saturation dome (approximate bell curve)
    // Saturated liquid line (left side of dome)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let t = 20; t <= Tc; t += 2) {
      // vf is approximately constant ~0.001
      const vfAtT = 0.001 + 0.002 * Math.pow(t / Tc, 4); // slight increase near Tc
      const x = toX(vfAtT);
      const y = toY(t);
      if (t === 20) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Saturated vapor line (right side of dome)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let t = Tc; t >= 20; t -= 2) {
      // vg decreases as T increases, converges to vf at Tc
      const pAtT = Math.exp((t - 99.6) / 36.5); // pressure at this T
      const tK = t + 273.15;
      const vgAtT = Math.max(0.003, (0.4615 * tK) / (pAtT * 100));
      const x = toX(vgAtT);
      const y = toY(t);
      if (t === Tc) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Critical point
    const cpVf = 0.001 + 0.002 * 1.0; // at Tc
    const cpX = toX(cpVf);
    const cpY = toY(Tc);
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(cpX, cpY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Critical Point', cpX + 10, cpY - 6);
    ctx.fillText('(374°C, 220.6 bar)', cpX + 10, cpY + 8);

    // Region labels
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : '#0284c7';
    ctx.textAlign = 'center';
    ctx.fillText('Subcooled', toX(0.0008), toY(150));
    ctx.fillText('Liquid', toX(0.0008), toY(130));

    ctx.fillStyle = isDark ? 'rgba(234, 179, 8, 0.7)' : '#ca8a04';
    ctx.fillText('Wet Mixture', toX(0.05), toY(150));
    ctx.fillText('(Liquid + Vapor)', toX(0.05), toY(130));

    ctx.fillStyle = isDark ? 'rgba(249, 115, 22, 0.7)' : '#ea580c';
    ctx.fillText('Superheated', toX(2.0), toY(150));
    ctx.fillText('Vapor', toX(2.0), toY(130));

    // Dome line labels
    ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.textAlign = 'right';
    ctx.fillText('Sat. Liquid (v_f)', toX(0.0008), toY(60));
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'left';
    ctx.fillText('Sat. Vapor (v_g)', toX(2.0), toY(60));

    // Constant-pressure line at current pressure
    if (pressureBar < Pc) {
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);

      // Horizontal line at T_sat
      ctx.beginPath();
      ctx.moveTo(toX(0.0005), toY(tSatC));
      ctx.lineTo(toX(5.0), toY(tSatC));
      ctx.stroke();
      ctx.setLineDash([]);

      // T_sat label
      ctx.fillStyle = '#14b8a6';
      ctx.font = 'bold 11px "Fira Code", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`T_sat = ${tSatC}°C`, W - padR - 4, toY(tSatC) - 8);
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`P = ${pressureBar} bar`, W - padR - 4, toY(tSatC) + 10);

      // vf and vg dots on the line
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(toX(vf), toY(tSatC), 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(toX(vg), toY(tSatC), 5, 0, Math.PI * 2);
      ctx.fill();

      // Labels for dots
      ctx.font = '9px "Fira Code", monospace';
      ctx.fillStyle = '#0284c7';
      ctx.textAlign = 'center';
      ctx.fillText(`v_f`, toX(vf), toY(tSatC) + 16);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`v_g=${vg.toFixed(3)}`, toX(vg), toY(tSatC) + 16);
    }

    ctx.textAlign = 'left';
  }, [pressureBar, tSatC, isDark, vf, vg]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        T-v Phase Diagram — Saturation Dome
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={540} height={360} className="w-full max-w-xl h-auto" />
      </div>

      {/* Pressure slider */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          Pressure:
        </label>
        <input
          type="range" min="1" max="200" step="1" value={pressureBar}
          onChange={(e) => setPressureBar(Number(e.target.value))}
          className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-teal-500 touch-pan-y"
        />
        <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400 w-20 text-right">
          {pressureBar} bar
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        A T-v diagram shows the phase regions of a pure substance. Inside the dome, liquid and vapor coexist as a wet mixture at the saturation temperature.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="x = \frac{v - v_f}{v_g - v_f}" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="x" /> — Quality (dryness fraction)</span>
          <span><MathView math="v" /> — Specific volume (m³/kg)</span>
          <span><MathView math="v_f, v_g" /> — Sat. liquid/vapor</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          x is defined only inside the saturation dome (0 ≤ x ≤ 1).
        </p>
      </div>
    </div>
  );
};
