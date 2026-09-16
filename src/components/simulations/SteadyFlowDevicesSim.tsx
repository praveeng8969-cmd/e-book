import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

type DeviceType = 'nozzle' | 'diffuser' | 'turbine' | 'compressor' | 'throttling';

const DEVICE_INFO: Record<DeviceType, {
  label: string;
  simplified: string;
  drawDevice: (ctx: CanvasRenderingContext2D, W: number, H: number, ct: ReturnType<typeof getCanvasTheme>, h1: number, h2: number, C1: number, C2: number, w: number) => void;
}> = {
  nozzle: {
    label: 'Nozzle',
    simplified: 'Q \\approx 0,\\; W = 0 \\implies h_1 + \\tfrac{C_1^2}{2} = h_2 + \\tfrac{C_2^2}{2}',
  } as any,
  diffuser: {
    label: 'Diffuser',
    simplified: 'Q \\approx 0,\\; W = 0 \\implies h_2 = h_1 + \\tfrac{C_1^2 - C_2^2}{2}',
  } as any,
  turbine: {
    label: 'Turbine',
    simplified: 'Q \\approx 0,\\; \\Delta KE \\approx 0 \\implies w_{out} = h_1 - h_2',
  } as any,
  compressor: {
    label: 'Compressor',
    simplified: 'Q \\approx 0,\\; \\Delta KE \\approx 0 \\implies w_{in} = h_2 - h_1',
  } as any,
  throttling: {
    label: 'Throttling Valve',
    simplified: 'Q = 0,\\; W = 0,\\; \\Delta KE \\approx 0 \\implies h_1 = h_2',
  } as any,
};

export const SteadyFlowDevicesSim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [device, setDevice] = useState<DeviceType>('nozzle');
  const [inletEnthalpy, setInletEnthalpy] = useState<number>(3200); // kJ/kg

  const C1 = 50; // m/s inlet velocity

  // Derived values
  const { h2, C2, work, description } = useMemo(() => {
    let h2 = inletEnthalpy, C2 = C1, work = 0, description = '';
    const enthDrop = 250; // kJ/kg typical

    switch (device) {
      case 'nozzle':
        h2 = inletEnthalpy - enthDrop;
        C2 = Math.sqrt(C1 * C1 + 2000 * enthDrop);
        description = 'Enthalpy → Kinetic energy. Velocity increases, pressure drops.';
        break;
      case 'diffuser':
        h2 = inletEnthalpy + (C1 * C1) / 2000 * 0.8;
        C2 = Math.sqrt(Math.max(0, C1 * C1 - 2000 * (h2 - inletEnthalpy)));
        description = 'Kinetic energy → Enthalpy. Velocity decreases, pressure rises.';
        break;
      case 'turbine':
        h2 = inletEnthalpy - enthDrop;
        C2 = C1;
        work = inletEnthalpy - h2;
        description = 'Enthalpy → Shaft work output. Fluid expands through blades.';
        break;
      case 'compressor':
        h2 = inletEnthalpy + enthDrop;
        C2 = C1;
        work = -(h2 - inletEnthalpy);
        description = 'Shaft work input → Enthalpy. Fluid pressure increases.';
        break;
      case 'throttling':
        h2 = inletEnthalpy;
        C2 = C1;
        description = 'Isenthalpic process. Pressure drops, no work, no heat exchange.';
        break;
    }
    return { h2: Math.round(h2), C2: Math.round(C2), work: Math.round(work), description };
  }, [device, inletEnthalpy]);

  // Canvas schematic
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
    const cy = H / 2;

    // Device box
    const boxW = 120;
    const boxH = 80;
    ctx.fillStyle = ct.isLight ? '#f0fdfa' : '#1e293b';
    ctx.fillRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
    ctx.strokeStyle = ct.containerBorder;
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);

    // Device label
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(DEVICE_INFO[device].label, cx, cy - 4);

    // Shape indicator
    if (device === 'nozzle') {
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = ct.textMuted;
      ctx.fillText('(converging)', cx, cy + 12);
    } else if (device === 'diffuser') {
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = ct.textMuted;
      ctx.fillText('(diverging)', cx, cy + 12);
    }

    // Inlet arrow
    const arrowLen = 70;
    ctx.strokeStyle = ct.primary;
    ctx.fillStyle = ct.primary;
    ctx.lineWidth = 2.5;
    const inX = cx - boxW / 2 - arrowLen;
    ctx.beginPath();
    ctx.moveTo(inX, cy);
    ctx.lineTo(cx - boxW / 2 - 4, cy);
    ctx.stroke();
    // arrowhead
    ctx.beginPath();
    ctx.moveTo(cx - boxW / 2 - 4, cy);
    ctx.lineTo(cx - boxW / 2 - 14, cy - 5);
    ctx.lineTo(cx - boxW / 2 - 14, cy + 5);
    ctx.closePath();
    ctx.fill();

    // Outlet arrow
    const outX = cx + boxW / 2 + arrowLen;
    ctx.beginPath();
    ctx.moveTo(cx + boxW / 2 + 4, cy);
    ctx.lineTo(outX, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(outX, cy);
    ctx.lineTo(outX - 10, cy - 5);
    ctx.lineTo(outX - 10, cy + 5);
    ctx.closePath();
    ctx.fill();

    // Inlet labels
    ctx.fillStyle = ct.textMain;
    ctx.font = '11px "Fira Code", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`h₁ = ${inletEnthalpy} kJ/kg`, cx - boxW / 2 - 12, cy - 22);
    ctx.fillText(`C₁ = ${C1} m/s`, cx - boxW / 2 - 12, cy - 8);

    // Outlet labels
    ctx.textAlign = 'left';
    ctx.fillText(`h₂ = ${h2} kJ/kg`, cx + boxW / 2 + 12, cy - 22);
    ctx.fillText(`C₂ = ${C2} m/s`, cx + boxW / 2 + 12, cy - 8);

    // Work arrow (if applicable)
    if (device === 'turbine') {
      ctx.strokeStyle = ct.success;
      ctx.fillStyle = ct.success;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + boxH / 2 + 4);
      ctx.lineTo(cx, cy + boxH / 2 + 40);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy + boxH / 2 + 40);
      ctx.lineTo(cx - 5, cy + boxH / 2 + 30);
      ctx.lineTo(cx + 5, cy + boxH / 2 + 30);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`w_out = ${Math.abs(work)} kJ/kg`, cx, cy + boxH / 2 + 56);
    } else if (device === 'compressor') {
      ctx.strokeStyle = ct.warning;
      ctx.fillStyle = ct.warning;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy - boxH / 2 - 40);
      ctx.lineTo(cx, cy - boxH / 2 - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, cy - boxH / 2 - 4);
      ctx.lineTo(cx - 5, cy - boxH / 2 - 14);
      ctx.lineTo(cx + 5, cy - boxH / 2 - 14);
      ctx.closePath();
      ctx.fill();
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`w_in = ${Math.abs(work)} kJ/kg`, cx, cy - boxH / 2 - 48);
    }

    // Description at top
    ctx.fillStyle = ct.textMuted;
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(description, 12, 18);

    ctx.textAlign = 'left';
  }, [device, inletEnthalpy, h2, C2, work, description, isDark]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Steady Flow Energy Equation (SFEE)
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={520} height={260} className="w-full max-w-xl h-auto" />
      </div>

      {/* Device selector */}
      <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        {(['nozzle', 'diffuser', 'turbine', 'compressor', 'throttling'] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDevice(d)}
            className={`flex-1 min-h-[40px] px-2 py-2 rounded-lg text-[11px] sm:text-xs font-bold capitalize transition-all ${
              device === d
                ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
            }`}
          >
            {DEVICE_INFO[d].label}
          </button>
        ))}
      </div>

      {/* Enthalpy slider */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">h₁:</label>
        <input
          type="range" min="2500" max="3500" step="50" value={inletEnthalpy}
          onChange={(e) => setInletEnthalpy(Number(e.target.value))}
          className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-teal-500 touch-pan-y"
        />
        <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400 w-28 text-right">
          {inletEnthalpy} kJ/kg
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        The Steady Flow Energy Equation balances enthalpy, kinetic energy, and work across a control volume with steady mass flow.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center overflow-x-auto">
          <MathView math="h_1 + \frac{C_1^2}{2} + q = h_2 + \frac{C_2^2}{2} + w" block />
        </div>
        <div className="text-center text-xs text-slate-500 dark:text-slate-400 overflow-x-auto">
          <MathView math={DEVICE_INFO[device].simplified} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="h" /> — Enthalpy (kJ/kg)</span>
          <span><MathView math="C" /> — Velocity (m/s)</span>
          <span><MathView math="w" /> — Specific work (kJ/kg)</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Steady state: ṁ_in = ṁ_out,&nbsp; dE_cv/dt = 0
        </p>
      </div>
    </div>
  );
};
