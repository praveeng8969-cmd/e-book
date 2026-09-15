import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ThermometerSnowflake, Flame, ArrowRight, Activity, Gauge, RotateCcw, Wind } from 'lucide-react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const JouleThomsonSim: React.FC = () => {
  const { isDark } = useTheme();
  const [initialTempK, setInitialTempK] = useState<number>(300); // Kelvin
  const [inletPressBar, setInletPressBar] = useState<number>(100); // bar
  const [exitPressBar, setExitPressBar] = useState<number>(10); // bar
  const [gasType, setGasType] = useState<'real' | 'ideal'>('real');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Joule Thomson Inversion Temperature approximation (Nitrogen / Real Gas T_inv,max ~ 600 K)
  // mu_JT = (dT/dP)_h
  // Inversion curve parabola: T_inv = T_max * (1 - (P/P_max)^1.2)
  const maxInversionTemp = 600; // K
  const maxInversionPress = 250; // bar

  // Check if state is in Cooling region (inside inversion curve) or Heating region (outside)
  const pRatio = Math.min(1, inletPressBar / maxInversionPress);
  const boundaryTempAtP = maxInversionTemp * Math.max(0, 1 - Math.pow(pRatio, 1.2));
  const isCoolingRegion = gasType === 'real' && initialTempK < boundaryTempAtP;

  // Approximate mu_JT (K/bar)
  let mu_JT = 0;
  if (gasType === 'real') {
    mu_JT = (boundaryTempAtP - initialTempK) / 250; // Positive in cooling zone, negative in heating zone
  } else {
    mu_JT = 0; // Ideal gas throttling dT = 0
  }

  const deltaP = exitPressBar - inletPressBar; // Negative
  const deltaT = mu_JT * deltaP; // dT = mu * dP
  const exitTempK = Math.max(20, Math.round((initialTempK + deltaT) * 10) / 10);

  // Particles for Porous Plug Animation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);

  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      pts.push({
        x: 20 + Math.random() * 260,
        y: 20 + Math.random() * 70,
        vx: 1.5 + Math.random() * 2,
        vy: (Math.random() - 0.5) * 0.8,
      });
    }
    particlesRef.current = pts;
  }, []);

  // Canvas Drawing: Dual View (Top: Porous Plug Valve Animation, Bottom: T-P Inversion Curve)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const ct = getCanvasTheme();
      const isLightTheme = !isDark;

      // Background
      ctx.fillStyle = ct.bg;
      ctx.fillRect(0, 0, width, height);

      // Section 1: Top Porous Plug Animation (Left: 30, Right: width-30, Top: 25, Bottom: 125)
      const pipeLeft = 30;
      const pipeRight = width - 30;
      const pipeTop = 25;
      const pipeBottom = 120;
      const pipeH = pipeBottom - pipeTop;
      const plugX = (pipeLeft + pipeRight) / 2 - 12;
      const plugW = 24;

      // Pipe outer walls
      ctx.strokeStyle = isLightTheme ? '#475569' : '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pipeLeft, pipeTop);
      ctx.lineTo(pipeRight, pipeTop);
      ctx.moveTo(pipeLeft, pipeBottom);
      ctx.lineTo(pipeRight, pipeBottom);
      ctx.stroke();

      // Inlet Color background (High Pressure P1, T1)
      const inletColor = isLightTheme ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fillStyle = inletColor;
      ctx.fillRect(pipeLeft, pipeTop + 2, plugX - pipeLeft, pipeH - 4);

      // Exit Color background (Throttled P2, T2)
      const exitColor = isCoolingRegion
        ? (isLightTheme ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.25)')
        : (isLightTheme ? 'rgba(234, 88, 12, 0.18)' : 'rgba(234, 88, 12, 0.25)');
      ctx.fillStyle = exitColor;
      ctx.fillRect(plugX + plugW, pipeTop + 2, pipeRight - (plugX + plugW), pipeH - 4);

      // Draw Porous Plug
      ctx.fillStyle = isLightTheme ? '#64748b' : '#334155';
      ctx.fillRect(plugX, pipeTop + 2, plugW, pipeH - 4);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      // Draw porous mesh pattern
      for (let py = pipeTop + 8; py < pipeBottom; py += 10) {
        for (let px = plugX + 4; px < plugX + plugW; px += 8) {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
      ctx.fillText('POROUS PLUG', plugX - 18, pipeTop - 8);

      // Throttling Particles Stream
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        if (p.x > pipeRight - 5) {
          p.x = pipeLeft + 5;
          p.y = pipeTop + 10 + Math.random() * (pipeH - 20);
        }

        // Particle speed & color changes past porous plug
        const isPastPlug = p.x > plugX + plugW;
        ctx.fillStyle = isPastPlug
          ? (isCoolingRegion ? '#38bdf8' : '#fb923c')
          : '#f87171';

        ctx.beginPath();
        ctx.arc(p.x, p.y, isPastPlug ? 3 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Readouts above pipe
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`Inlet: P₁=${inletPressBar} bar, T₁=${initialTempK} K`, pipeLeft + 10, pipeBottom + 20);

      ctx.fillStyle = isCoolingRegion ? '#06b6d4' : '#f97316';
      ctx.fillText(
        `Exit: P₂=${exitPressBar} bar, T₂=${exitTempK} K (ΔT=${deltaT > 0 ? '+' : ''}${deltaT.toFixed(1)} K)`,
        plugX + plugW + 10,
        pipeBottom + 20
      );

      // Section 2: Bottom T-P Inversion Curve Chart
      const cLeft = 55;
      const cRight = width - 40;
      const cBottom = height - 40;
      const cTop = 175;
      const cW = cRight - cLeft;
      const cH = cBottom - cTop;

      const pToX = (p: number) => cLeft + (p / 300) * cW;
      const tToY = (t: number) => cBottom - (t / 800) * cH;

      // Axes
      ctx.strokeStyle = ct.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cLeft, cTop);
      ctx.lineTo(cLeft, cBottom);
      ctx.lineTo(cRight, cBottom);
      ctx.stroke();

      ctx.fillStyle = ct.axisLabel;
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText('T (K)', cLeft - 10, cTop - 5);
      ctx.fillText('P (bar) →', cRight - 40, cBottom + 22);

      // Inversion Curve
      ctx.fillStyle = ct.isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.1)';
      ctx.beginPath();
      ctx.moveTo(pToX(0), tToY(0));
      for (let p = 0; p <= maxInversionPress; p += 5) {
        const t_inv = maxInversionTemp * Math.max(0, 1 - Math.pow(p / maxInversionPress, 1.2));
        ctx.lineTo(pToX(p), tToY(t_inv));
      }
      ctx.lineTo(pToX(0), tToY(0));
      ctx.closePath();
      ctx.fill();

      // Stroke Inversion Curve
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pToX(0), tToY(maxInversionTemp));
      for (let p = 0; p <= maxInversionPress; p += 5) {
        const t_inv = maxInversionTemp * Math.max(0, 1 - Math.pow(p / maxInversionPress, 1.2));
        ctx.lineTo(pToX(p), tToY(t_inv));
      }
      ctx.stroke();

      // Region Annotations
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText('COOLING REGION (μ_JT > 0)', pToX(40), tToY(240));

      ctx.fillStyle = '#ea580c';
      ctx.fillText('HEATING REGION (μ_JT < 0)', pToX(140), tToY(520));

      // Throttling Isenthalpic Path Line (1 -> 2)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pToX(inletPressBar), tToY(initialTempK));
      ctx.lineTo(pToX(exitPressBar), tToY(exitTempK));
      ctx.stroke();

      // Plot Initial State Point 1
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pToX(inletPressBar), tToY(initialTempK), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('1 (Inlet)', pToX(inletPressBar) + 7, tToY(initialTempK) - 5);

      // Plot Exit State Point 2
      ctx.fillStyle = isCoolingRegion ? '#06b6d4' : '#f97316';
      ctx.beginPath();
      ctx.arc(pToX(exitPressBar), tToY(exitTempK), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('2 (Exit)', pToX(exitPressBar) + 7, tToY(exitTempK) - 5);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [initialTempK, inletPressBar, exitPressBar, isCoolingRegion, deltaT, exitTempK, isDark]);

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Joule-Thomson Throttling Valve & Inversion Curve Lab
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Isenthalpic expansion ($h_1 = h_2$) through porous plug with Joule-Thomson coefficient $\mu_{'{'}JT{'}'} = (\partial T/\partial P)_h$.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setInitialTempK(300);
            setInletPressBar(100);
            setExitPressBar(10);
            setGasType('real');
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Reset Inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Interactive Canvas */}
      <div className="bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={680}
          height={340}
          className="w-full max-w-[680px] h-[340px] rounded-xl shadow-inner"
        />
      </div>

      {/* Sliders for Inlet Pressure, Exit Pressure, Initial Temperature */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Inlet Pressure */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Inlet Pressure ($P_1$)</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{inletPressBar} bar</span>
          </div>
          <input
            type="range"
            min={exitPressBar + 5}
            max="250"
            step="5"
            value={inletPressBar}
            onChange={(e) => setInletPressBar(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>{exitPressBar + 5} bar</span>
            <span>250 bar (High pressure)</span>
          </div>
        </div>

        {/* Exit Pressure */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-teal-600 dark:text-teal-400">Exit Pressure ($P_2$)</span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{exitPressBar} bar</span>
          </div>
          <input
            type="range"
            min="1"
            max={inletPressBar - 5}
            step="1"
            value={exitPressBar}
            onChange={(e) => setExitPressBar(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>1 bar (Atmospheric)</span>
            <span>{inletPressBar - 5} bar</span>
          </div>
        </div>

        {/* Initial Temperature */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Inlet Temp ($T_1$)</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{initialTempK} K ({(initialTempK - 273.15).toFixed(0)}°C)</span>
          </div>
          <input
            type="range"
            min="100"
            max="750"
            step="10"
            value={initialTempK}
            onChange={(e) => setInitialTempK(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>100 K (-173°C)</span>
            <span>750 K (477°C)</span>
          </div>
        </div>
      </div>

      {/* Outcome Banner & Readouts */}
      <div className={`p-4 rounded-xl border ${isCoolingRegion ? 'border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/20' : 'border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'} flex flex-wrap items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${isCoolingRegion ? 'bg-cyan-500/10 text-cyan-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {isCoolingRegion ? <ThermometerSnowflake className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Throttling Thermal Outcome
            </div>
            <div className={`text-base sm:text-lg font-extrabold ${isCoolingRegion ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isCoolingRegion ? 'COOLING OCCURS (Inside Inversion Dome, μ_JT > 0)' : 'HEATING OCCURS (Outside Inversion Dome, μ_JT < 0)'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400">$\mu_{'{'}JT{'}'}$: </span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {mu_JT.toFixed(3)} K/bar
            </span>
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400">Exit Temp $T_2$: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {exitTempK} K ({(exitTempK - 273.15).toFixed(1)}°C)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
