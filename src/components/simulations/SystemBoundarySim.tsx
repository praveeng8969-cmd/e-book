import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const SystemBoundarySim: React.FC = () => {
  const { isDark } = useTheme();
  const [systemType, setSystemType] = useState<'closed' | 'open' | 'isolated'>('closed');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [heatInput, setHeatInput] = useState<number>(50); // 0 to 100
  const [pistonPosition, setPistonPosition] = useState<number>(0.5); // 0.2 to 0.8
  const [temperature, setTemperature] = useState<number>(300); // Kelvin
  const [massCount, setMassCount] = useState<number>(24);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particles simulation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }>>([]);

  useEffect(() => {
    // Initialize particles
    const particles = [];
    const count = systemType === 'open' ? 32 : 24;
    setMassCount(count);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: 50 + Math.random() * 200,
        y: 60 + Math.random() * 120,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 4,
        color: '#38bdf8',
      });
    }
    particlesRef.current = particles;
  }, [systemType]);

  // Adjust temperature and piston position based on heatInput
  useEffect(() => {
    const calculatedTemp = 300 + (heatInput * 3.5);
    setTemperature(Math.round(calculatedTemp));
    if (systemType === 'closed') {
      setPistonPosition(0.35 + (heatInput / 100) * 0.45);
    } else {
      setPistonPosition(0.5);
    }
  }, [heatInput, systemType]);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Speed multiplier based on temperature
      const speedFactor = Math.sqrt(temperature / 300);

      // Boundaries definition
      const left = 60;
      const right = width - 60;
      const bottom = height - 50;
      const top = systemType === 'closed' ? bottom - (pistonPosition * (bottom - 40)) : 50;

      const ct = getCanvasTheme();

      // Draw surroundings background
      ctx.fillStyle = ct.bg;
      ctx.fillRect(0, 0, width, height);

      // Draw Chamber Box
      if (systemType === 'isolated') {
        // Thick vacuum insulation boundary
        ctx.strokeStyle = ct.warning;
        ctx.lineWidth = 14;
        ctx.strokeRect(left - 7, top - 7, right - left + 14, bottom - top + 14);
        ctx.fillStyle = ct.isLight ? '#fef3c7' : '#1e1b4b';
        ctx.fillRect(left, top, right - left, bottom - top);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);
      } else if (systemType === 'closed') {
        // Rigid side & bottom walls
        ctx.fillStyle = ct.chamberBg;
        ctx.fillRect(left, top, right - left, bottom - top);

        // Cylinder walls
        ctx.strokeStyle = ct.containerBorder;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(left, 30);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, 30);
        ctx.stroke();

        // Movable Piston Head
        ctx.fillStyle = ct.isLight ? '#cbd5e1' : '#334155';
        ctx.strokeStyle = ct.isLight ? '#94a3b8' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.fillRect(left + 2, top - 16, right - left - 4, 16);
        ctx.strokeRect(left + 2, top - 16, right - left - 4, 16);

        // Piston Rod
        ctx.fillStyle = ct.isLight ? '#94a3b8' : '#64748b';
        ctx.fillRect(width / 2 - 8, top - 60, 16, 44);

        // Work output arrow if expanding
        if (heatInput > 50) {
          ctx.strokeStyle = ct.success;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(width / 2, top - 65);
          ctx.lineTo(width / 2, top - 90);
          ctx.lineTo(width / 2 - 6, top - 82);
          ctx.moveTo(width / 2, top - 90);
          ctx.lineTo(width / 2 + 6, top - 82);
          ctx.stroke();
          ctx.fillStyle = ct.success;
          ctx.font = '11px Plus Jakarta Sans, sans-serif';
          ctx.fillText('+W (Boundary Work)', width / 2 + 12, top - 75);
        }
      } else {
        // Open System (Control Volume Pipe / Vessel with Inflow & Outflow)
        ctx.fillStyle = ct.chamberBg;
        ctx.fillRect(left, top, right - left, bottom - top);

        // Pipe entry & exit
        ctx.strokeStyle = ct.containerBorder;
        ctx.lineWidth = 6;
        // Upper wall with inlet opening
        ctx.beginPath();
        ctx.moveTo(10, top + 30);
        ctx.lineTo(left, top + 30);
        ctx.lineTo(left, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom - 30);
        ctx.lineTo(width - 10, bottom - 30);
        ctx.stroke();

        // Lower wall
        ctx.beginPath();
        ctx.moveTo(10, top + 70);
        ctx.lineTo(left, top + 70);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, bottom + 10);
        ctx.lineTo(width - 10, bottom + 10);
        ctx.stroke();

        // Dashed Control Volume Boundary
        ctx.strokeStyle = ct.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);

        // Inflow / Outflow mass indicators
        ctx.fillStyle = ct.primary;
        ctx.font = '12px Plus Jakarta Sans, sans-serif';
        ctx.fillText('ṁ_in (Mass In)', 15, top + 20);
        ctx.fillText('ṁ_out (Mass Out)', width - 110, bottom - 40);
      }

      // Heat transfer flame/arrows at bottom (if not isolated)
      if (systemType !== 'isolated' && heatInput > 10) {
        const flameY = bottom + 14;
        const heatColor = isDark ? '#f97316' : '#c2410c';
        const flameColor = isDark
          ? (heatInput > 60 ? '#f97316' : '#eab308')
          : (heatInput > 60 ? '#ea580c' : '#d97706');
        ctx.fillStyle = flameColor;
        ctx.beginPath();
        for (let x = left + 20; x < right - 20; x += 30) {
          ctx.arc(x, flameY, 6 + Math.sin(Date.now() * 0.01 + x) * 2, 0, Math.PI * 2);
        }
        ctx.fill();

        // Heat flow arrow
        ctx.strokeStyle = heatColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width / 2, flameY + 16);
        ctx.lineTo(width / 2, bottom - 5);
        ctx.lineTo(width / 2 - 5, bottom + 5);
        ctx.moveTo(width / 2, bottom - 5);
        ctx.lineTo(width / 2 + 5, bottom + 5);
        ctx.stroke();
        ctx.fillStyle = heatColor;
        ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
        ctx.fillText('Heat Supply (Q > 0)', width / 2 + 10, flameY + 10);
      }

      // Update & Draw Particles
      if (isPlaying) {
        particlesRef.current.forEach((p) => {
          p.x += p.vx * speedFactor;
          p.y += p.vy * speedFactor;

          // Horizontal bounds
          if (systemType === 'open') {
            if (p.x < left && p.y < top + 30) p.vx = Math.abs(p.vx);
            if (p.x < 10) {
              p.x = right - 10;
              p.y = bottom - 20 + Math.random() * 20;
            }
            if (p.x > width - 10) {
              p.x = 15;
              p.y = top + 40 + Math.random() * 20;
            }
          } else {
            if (p.x - p.radius < left) {
              p.x = left + p.radius;
              p.vx = -p.vx;
            }
            if (p.x + p.radius > right) {
              p.x = right - p.radius;
              p.vx = -p.vx;
            }
          }

          // Vertical bounds
          if (p.y - p.radius < top) {
            p.y = top + p.radius;
            p.vy = -p.vy;
          }
          if (p.y + p.radius > bottom) {
            p.y = bottom - p.radius;
            p.vy = -p.vy;
          }

          // Particle color based on temperature
          const r = Math.min(255, Math.floor(56 + (temperature - 300) * 0.7));
          const g = Math.max(100, Math.floor(189 - (temperature - 300) * 0.3));
          const b = Math.max(80, Math.floor(248 - (temperature - 300) * 0.6));
          p.color = `rgb(${r}, ${g}, ${b})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
      }

      // Labeling system
      ctx.fillStyle = ct.textMain;
      ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        systemType === 'closed'
          ? 'CLOSED SYSTEM (Control Mass, Δm = 0)'
          : systemType === 'open'
          ? 'OPEN SYSTEM (Control Volume, Δm ≠ 0)'
          : 'ISOLATED SYSTEM (No Heat, No Work, No Mass)',
        20,
        25
      );

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, systemType, temperature, pistonPosition, heatInput, isDark]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Interactive Thermodynamic Systems & Boundaries</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Visual particle dynamics, boundary displacement, and energy interactions</p>
          </div>
        </div>

        {/* System Selectors */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['closed', 'open', 'isolated'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSystemType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                systemType === type
                  ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              {type} System
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center items-center">
        <canvas ref={canvasRef} width={640} height={320} className="w-full max-w-2xl h-auto" />
      </div>

      {/* Live Readout & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Mass Transfer (Δm)</span>
          <div className="text-sm font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
            {systemType === 'open' ? 'Permeable (ṁ > 0)' : 'Impermeable (m = Const)'}
          </div>
          <p className="text-[11px] text-slate-500">
            {systemType === 'open' ? 'Mass crosses control surface' : 'Mass remains strictly fixed inside'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Energy Transfer (Q & W)</span>
          <div className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            {systemType === 'isolated' ? 'Zero (Q = 0, W = 0)' : `Active (T = ${temperature} K)`}
          </div>
          <p className="text-[11px] text-slate-500">
            {systemType === 'isolated' ? 'Rigid insulated adiabatic wall' : 'Heat flux & displacement work allowed'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Real-World Analog</span>
          <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {systemType === 'closed'
              ? 'Piston-Cylinder, Sealed Can'
              : systemType === 'open'
              ? 'Turbine, Nozzle, Compressor'
              : 'Thermos Flask, Universe'}
          </div>
          <p className="text-[11px] text-slate-500">
            {systemType === 'closed' ? 'Control Mass approach' : systemType === 'open' ? 'Control Volume approach' : 'Perfect isolation'}
          </p>
        </div>
      </div>

      {/* Control Sliders */}
      {systemType !== 'isolated' && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">Heat Supply (Q):</span>
            <input
              type="range"
              min="0"
              max="100"
              value={heatInput}
              onChange={(e) => setHeatInput(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-slate-300 dark:border-slate-600"
            />
            <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 w-12 text-right">{heatInput}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setHeatInput(50);
                setIsPlaying(true);
              }}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Key Takeaway Box */}
      <div className="bg-emerald-50/70 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
          <span>⚡</span> Quick Revision — System Boundary Classification
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Closed (Control Mass):</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Mass fixed ($\Delta m = 0$), energy crosses boundary ($Q, W \neq 0$). Ex: Piston-cylinder without valves.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Open (Control Volume):</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Both mass and energy cross boundary ($\Delta m \neq 0, \Delta E \neq 0$). Ex: Turbines, nozzles, compressors.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-emerald-100 dark:border-emerald-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Isolated System:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Neither mass nor energy crosses boundary ($m, Q, W = 0$). Rigid + adiabatic walls. Ex: Universe.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
