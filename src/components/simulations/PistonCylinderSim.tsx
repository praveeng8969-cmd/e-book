import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export const PistonCylinderSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [volume, setVolume] = useState<number>(0.05); // m³ (0.02 – 0.10)

  const R = 8.314; // J/(mol·K)
  const n = 2.0;   // mol
  const T = 350;   // K fixed

  const pressureKPa = useMemo(() => {
    return Math.round(((n * R * T) / volume) / 100) / 10; // kPa, 1 decimal
  }, [volume]);

  // Particles for gas motion
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);

  useEffect(() => {
    const pts: typeof particlesRef.current = [];
    for (let i = 0; i < 30; i++) {
      pts.push({
        x: 50 + Math.random() * 200,
        y: 80 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }
    particlesRef.current = pts;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const ct = getCanvasTheme();

      // Background
      ctx.fillStyle = ct.bg;
      ctx.fillRect(0, 0, W, H);

      // Cylinder geometry
      const cylL = 60, cylR = W - 60, cylB = H - 40, cylT = 40;
      const vFrac = (volume - 0.02) / 0.08;
      const pistonY = cylB - (vFrac * (cylB - cylT - 40) + 40);

      // Gas fill
      ctx.fillStyle = ct.primaryFill;
      ctx.fillRect(cylL + 4, pistonY + 14, cylR - cylL - 8, cylB - pistonY - 14);

      // Cylinder walls (U-shape)
      ctx.strokeStyle = ct.containerBorder;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cylL, cylT);
      ctx.lineTo(cylL, cylB);
      ctx.lineTo(cylR, cylB);
      ctx.lineTo(cylR, cylT);
      ctx.stroke();

      // Piston head
      ctx.fillStyle = ct.isLight ? '#0284c7' : '#38bdf8';
      ctx.fillRect(cylL + 4, pistonY, cylR - cylL - 8, 14);
      ctx.strokeStyle = ct.isLight ? '#0369a1' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(cylL + 4, pistonY, cylR - cylL - 8, 14);

      // Piston rod
      const rodX = (cylL + cylR) / 2;
      ctx.fillStyle = ct.isLight ? '#94a3b8' : '#475569';
      ctx.fillRect(rodX - 7, pistonY - 40, 14, 40);

      // Particles
      const pts = particlesRef.current;
      ctx.fillStyle = ct.isLight ? '#0284c7' : '#38bdf8';
      for (const p of pts) {
        if (shouldAnimate) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < cylL + 10) { p.x = cylL + 10; p.vx = Math.abs(p.vx); }
          if (p.x > cylR - 10) { p.x = cylR - 10; p.vx = -Math.abs(p.vx); }
          if (p.y < pistonY + 18) { p.y = pistonY + 18; p.vy = Math.abs(p.vy); }
          if (p.y > cylB - 8) { p.y = cylB - 8; p.vy = -Math.abs(p.vy); }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels on canvas
      ctx.fillStyle = ct.textMain;
      ctx.font = 'bold 12px "Fira Code", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`V = ${(volume * 1000).toFixed(1)} L`, cylL + 8, cylT + 18);
      ctx.textAlign = 'right';
      ctx.fillText(`P = ${pressureKPa.toFixed(1)} kPa`, cylR - 8, cylT + 18);
      ctx.textAlign = 'center';
      ctx.fillText(`T = ${T} K`, rodX, cylT + 18);
      ctx.textAlign = 'left';

      // Arrow labels
      ctx.fillStyle = ct.textMuted;
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('↑ Piston', rodX, pistonY - 44);
      ctx.fillText('Gas', rodX, (pistonY + 14 + cylB) / 2 + 4);
      ctx.textAlign = 'left';

      if (shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [volume, pressureKPa, isDark, shouldAnimate]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Title */}
      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
        Piston–Cylinder Assembly
      </h4>

      {/* Canvas */}
      <div className="bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center">
        <canvas ref={canvasRef} width={480} height={280} className="w-full max-w-lg h-auto" />
      </div>

      {/* Volume slider */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          Volume (V):
        </label>
        <input
          type="range"
          min="0.02"
          max="0.10"
          step="0.002"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 min-w-[140px] h-8 bg-transparent appearance-none cursor-pointer accent-teal-500 touch-pan-y"
        />
        <span className="text-sm font-mono font-bold text-teal-600 dark:text-teal-400 w-20 text-right">
          {(volume * 1000).toFixed(1)} L
        </span>
      </div>

      {/* Definition */}
      <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
        A piston–cylinder assembly is a closed system where gas is sealed inside a cylinder by a movable piston.
        Moving the piston changes the gas volume and pressure.
      </p>

      {/* Formula */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 space-y-2">
        <div className="text-center">
          <MathView math="PV = nRT" block />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400 font-mono">
          <span><MathView math="P" /> — Pressure (kPa)</span>
          <span><MathView math="V" /> — Volume (m³)</span>
          <span><MathView math="n" /> — Amount (mol)</span>
          <span><MathView math="R" /> — 8.314 J/(mol·K)</span>
          <span><MathView math="T" /> — Temperature (K)</span>
        </div>
      </div>
    </div>
  );
};
