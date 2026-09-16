import React, { useState, useRef, useEffect } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const SystemBoundarySim: React.FC = () => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [systemType, setSystemType] = useState<'closed' | 'open' | 'isolated'>('closed');

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
    const cy = H / 2 + 5;
    const bw = 160; // box half-width
    const bh = 80;  // box half-height

    // Helper: draw arrow
    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, label: string, labelSide: 'top' | 'bottom' | 'left' | 'right' = 'top') => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      if (labelSide === 'top') ctx.fillText(label, (x1 + x2) / 2, Math.min(y1, y2) - 8);
      else if (labelSide === 'bottom') ctx.fillText(label, (x1 + x2) / 2, Math.max(y1, y2) + 16);
      else if (labelSide === 'left') {
        ctx.textAlign = 'right';
        ctx.fillText(label, Math.min(x1, x2) - 8, (y1 + y2) / 2 + 4);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(label, Math.max(x1, x2) + 8, (y1 + y2) / 2 + 4);
      }
      ctx.textAlign = 'left';
    };

    // System box
    const boxL = cx - bw;
    const boxR = cx + bw;
    const boxT = cy - bh;
    const boxB = cy + bh;

    // Fill
    ctx.fillStyle = ct.isLight ? '#f0fdfa' : '#0f172a';
    ctx.fillRect(boxL, boxT, bw * 2, bh * 2);

    // Boundary
    if (systemType === 'isolated') {
      // Thick double boundary
      ctx.strokeStyle = ct.warning;
      ctx.lineWidth = 8;
      ctx.strokeRect(boxL, boxT, bw * 2, bh * 2);
      ctx.strokeStyle = ct.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(boxL + 6, boxT + 6, bw * 2 - 12, bh * 2 - 12);
      ctx.setLineDash([]);
    } else if (systemType === 'open') {
      // Dashed boundary
      ctx.strokeStyle = ct.primary;
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(boxL, boxT, bw * 2, bh * 2);
      ctx.setLineDash([]);
    } else {
      // Solid boundary
      ctx.strokeStyle = ct.containerBorder;
      ctx.lineWidth = 4;
      ctx.strokeRect(boxL, boxT, bw * 2, bh * 2);
    }

    // System label
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SYSTEM', cx, cy - 8);

    // Type label
    ctx.font = '12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = ct.textMuted;
    ctx.fillText(
      systemType === 'closed' ? '(Control Mass)' :
      systemType === 'open' ? '(Control Volume)' : '(No interactions)',
      cx, cy + 10
    );

    // Surroundings label
    ctx.fillStyle = ct.textMuted;
    ctx.font = '11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Surroundings', 12, 22);
    ctx.textAlign = 'left';

    // Boundary label
    ctx.fillStyle = systemType === 'isolated' ? ct.warning : systemType === 'open' ? ct.primary : ct.containerBorder;
    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      systemType === 'isolated' ? 'Rigid Adiabatic Boundary' :
      systemType === 'open' ? 'Permeable Control Surface' : 'Impermeable Boundary',
      cx, boxB + 14
    );

    // Arrows based on type
    if (systemType === 'closed') {
      // Energy crosses (Q, W), mass does not
      drawArrow(boxL - 50, cy - 20, boxL - 4, cy - 20, ct.heat, 'Q (heat)', 'top');
      drawArrow(boxR + 4, cy - 20, boxR + 50, cy - 20, ct.success, 'W (work)', 'top');

      // Blocked mass indicator
      ctx.fillStyle = ct.danger;
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✗ mass', cx, boxB + 28);
      ctx.fillStyle = ct.success;
      ctx.fillText('✓ energy', cx, boxB + 42);
    } else if (systemType === 'open') {
      // Mass and energy both cross
      drawArrow(boxL - 50, cy - 20, boxL - 4, cy - 20, ct.primary, 'ṁ_in', 'top');
      drawArrow(boxR + 4, cy - 20, boxR + 50, cy - 20, ct.primary, 'ṁ_out', 'top');
      drawArrow(boxL - 50, cy + 20, boxL - 4, cy + 20, ct.heat, 'Q', 'bottom');
      drawArrow(boxR + 4, cy + 20, boxR + 50, cy + 20, ct.success, 'W', 'bottom');

      ctx.fillStyle = ct.success;
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓ mass  ✓ energy', cx, boxB + 28);
    } else {
      // Nothing crosses
      ctx.fillStyle = ct.danger;
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✗ mass  ✗ energy', cx, boxB + 28);
      ctx.fillText('Q = 0,  W = 0,  Δm = 0', cx, boxB + 42);
    }

    ctx.textAlign = 'left';
  }, [systemType, isDark]);

  return (
    <div className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Thermodynamic System Boundaries
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={480} height={260} className="w-full max-w-lg h-auto" />
      </div>

      {/* Type selector */}
      <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
        {(['closed', 'open', 'isolated'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSystemType(type)}
            className={`flex-1 min-h-[40px] px-3 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all ${
              systemType === type
                ? 'bg-teal-600 text-white shadow-sm dark:bg-teal-500 dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        A thermodynamic system is a region chosen for study.
        Its boundary determines whether mass and energy can cross.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="\text{Universe} = \text{System} + \text{Surroundings}" block />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-mono">
          Closed: Δm = 0 &nbsp;|&nbsp; Open: Δm ≠ 0 &nbsp;|&nbsp; Isolated: Q = 0, W = 0, Δm = 0
        </p>
      </div>
    </div>
  );
};
