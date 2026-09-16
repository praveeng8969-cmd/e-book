import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

type ProcessType = 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic';

export const PVDomainSim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [processType, setProcessType] = useState<ProcessType>('isothermal');
  const [volumeRatio, setVolumeRatio] = useState<number>(2.0); // V2/V1

  // State 1 reference
  const P1 = 400; // kPa
  const V1 = 0.04; // m³
  const gamma = 1.4;
  const nRT = P1 * V1; // for isothermal (= const)

  // Generate process curve data
  const processData = useMemo(() => {
    const pts: Array<{ v: number; p: number }> = [];
    const V2 = V1 * volumeRatio;
    const vMin = Math.min(V1, V2) * 0.8;
    const vMax = Math.max(V1, V2) * 1.2;
    const steps = 80;

    for (let i = 0; i <= steps; i++) {
      const v = vMin + (i / steps) * (vMax - vMin);
      let p = 0;

      switch (processType) {
        case 'isothermal':
          p = nRT / v; // PV = const
          break;
        case 'isobaric':
          p = P1; // P = const
          break;
        case 'isochoric':
          p = P1; // only one V value matters, this will be drawn as vertical line
          break;
        case 'adiabatic':
          p = P1 * Math.pow(V1 / v, gamma); // PV^γ = const
          break;
      }

      pts.push({ v, p });
    }
    return pts;
  }, [processType, volumeRatio]);

  // Calculate work
  const workKJ = useMemo(() => {
    const V2 = V1 * volumeRatio;
    switch (processType) {
      case 'isothermal':
        return nRT * Math.log(V2 / V1); // kPa·m³ = kJ
      case 'isobaric':
        return P1 * (V2 - V1);
      case 'isochoric':
        return 0;
      case 'adiabatic':
        const P2 = P1 * Math.pow(V1 / V2, gamma);
        return (P1 * V1 - P2 * V2) / (gamma - 1);
      default:
        return 0;
    }
  }, [processType, volumeRatio]);

  const P2 = useMemo(() => {
    const V2 = V1 * volumeRatio;
    switch (processType) {
      case 'isothermal': return nRT / V2;
      case 'isobaric': return P1;
      case 'isochoric': return P1 * volumeRatio; // P2/P1 = T2/T1, slider acts as temp ratio
      case 'adiabatic': return P1 * Math.pow(V1 / V2, gamma);
      default: return P1;
    }
  }, [processType, volumeRatio]);

  // Canvas P-V diagram
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
    const padL = 60, padR = 20, padT = 25, padB = 50;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    // Data ranges
    const V2 = V1 * volumeRatio;
    const allP = processData.map(d => d.p);
    const pMin = 0;
    const pMax = Math.max(...allP) * 1.15;
    const vMin = 0;
    const vMax = Math.max(V1, V2) * 1.4;

    const toX = (v: number) => padL + ((v - vMin) / (vMax - vMin)) * plotW;
    const toY = (p: number) => padT + plotH - ((p - pMin) / (pMax - pMin)) * plotH;

    // Grid
    ctx.strokeStyle = ct.gridLine;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 4; i++) {
      const gy = padT + (i / 5) * plotH;
      ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(W - padR, gy); ctx.stroke();
      const gx = padL + (i / 5) * plotW;
      ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + plotH); ctx.stroke();
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
    ctx.fillText('Volume V (m³)', padL + plotW / 2, H - 8);

    ctx.save();
    ctx.translate(16, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pressure P (kPa)', 0, 0);
    ctx.restore();

    // Tick labels
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = ct.textMuted;
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const v = vMin + (i / 5) * (vMax - vMin);
      ctx.fillText(v.toFixed(3), toX(v), padT + plotH + 16);
    }
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const p = pMin + (i / 5) * (pMax - pMin);
      ctx.fillText(Math.round(p).toString(), padL - 6, toY(p) + 4);
    }

    // Process curve
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 3;
    ctx.beginPath();

    if (processType === 'isochoric') {
      // Vertical line at V1
      ctx.moveTo(toX(V1), toY(P1));
      ctx.lineTo(toX(V1), toY(P2));
    } else {
      const filteredData = processData.filter(d => d.v >= Math.min(V1, V2) && d.v <= Math.max(V1, V2));
      filteredData.forEach((d, i) => {
        const x = toX(d.v);
        const y = toY(d.p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    }
    ctx.stroke();

    // Shaded work area (under curve down to P=0 axis)
    if (processType !== 'isochoric') {
      ctx.fillStyle = isDark ? 'rgba(20, 184, 166, 0.12)' : 'rgba(20, 184, 166, 0.15)';
      ctx.beginPath();
      const filteredData = processData.filter(d => d.v >= Math.min(V1, V2) && d.v <= Math.max(V1, V2));
      if (filteredData.length > 0) {
        ctx.moveTo(toX(filteredData[0].v), toY(0));
        filteredData.forEach(d => ctx.lineTo(toX(d.v), toY(d.p)));
        ctx.lineTo(toX(filteredData[filteredData.length - 1].v), toY(0));
        ctx.closePath();
        ctx.fill();
      }

      // "W" label in shaded area
      ctx.fillStyle = ct.textMuted;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      const midV = (V1 + V2) / 2;
      ctx.fillText(`W = ${Math.abs(workKJ).toFixed(1)} kJ`, toX(midV), toY(0) - 14);
    }

    // State 1 dot
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(toX(V1), toY(P1), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('State 1', toX(V1) + 10, toY(P1) - 6);

    // State 2 dot
    const v2x = processType === 'isochoric' ? V1 : V2;
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(toX(v2x), toY(P2), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ct.textMain;
    ctx.textAlign = 'right';
    ctx.fillText('State 2', toX(v2x) - 10, toY(P2) - 6);

    // Process direction arrow
    if (processType !== 'isochoric') {
      const arrowV = (V1 + V2) / 2;
      let arrowP = 0;
      switch (processType) {
        case 'isothermal': arrowP = nRT / arrowV; break;
        case 'isobaric': arrowP = P1; break;
        case 'adiabatic': arrowP = P1 * Math.pow(V1 / arrowV, gamma); break;
      }
      ctx.fillStyle = '#14b8a6';
      const dir = V2 > V1 ? 1 : -1;
      const ax = toX(arrowV);
      const ay = toY(arrowP);
      ctx.beginPath();
      ctx.moveTo(ax + dir * 8, ay);
      ctx.lineTo(ax - dir * 4, ay - 5);
      ctx.lineTo(ax - dir * 4, ay + 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.textAlign = 'left';
  }, [processType, volumeRatio, processData, isDark, workKJ, P2]);

  // Process formula text
  const formulaMap: Record<ProcessType, string> = {
    isothermal: 'W = nRT \\ln\\left(\\frac{V_2}{V_1}\\right) \\quad (\\Delta U = 0,\\; Q = W)',
    isobaric: 'W = P(V_2 - V_1) \\quad (Q = nC_p \\Delta T)',
    isochoric: 'W = 0 \\quad (Q = \\Delta U = nC_v \\Delta T)',
    adiabatic: 'W = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1} \\quad (Q = 0)',
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        P-V Work — Closed System Processes
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={520} height={320} className="w-full max-w-xl h-auto" />
      </div>

      {/* Process selector */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        {(['isothermal', 'isobaric', 'isochoric', 'adiabatic'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProcessType(p)}
            className={`flex-1 min-h-[40px] px-2.5 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all ${
              processType === p
                ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Volume ratio slider */}
      {processType !== 'isochoric' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
            V₂/V₁:
          </label>
          <input
            type="range" min="0.5" max="3.0" step="0.1" value={volumeRatio}
            onChange={(e) => setVolumeRatio(parseFloat(e.target.value))}
            className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-teal-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400 w-12 text-right">
            {volumeRatio.toFixed(1)}
          </span>
        </div>
      )}

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        Boundary work in a closed system equals the area under the process curve on a P-V diagram: <MathView math="W = \int P\,dV" />.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center overflow-x-auto">
          <MathView math={formulaMap[processType]} block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="W" /> — Work (kJ)</span>
          <span><MathView math="P" /> — Pressure (kPa)</span>
          <span><MathView math="V" /> — Volume (m³)</span>
          <span><MathView math="\gamma" /> — 1.4 (diatomic)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Valid for quasi-static processes of an ideal gas.
        </p>
      </div>
    </div>
  );
};
