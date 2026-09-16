import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ThermometerSnowflake,
  Flame,
  ArrowRight,
  Activity,
  Gauge,
  RotateCcw,
  Wind,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export const JouleThomsonSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);

  // Operating parameters
  const [initialTempK, setInitialTempK] = useState<number>(300); // Kelvin
  const [inletPressBar, setInletPressBar] = useState<number>(120); // bar
  const [exitPressBar, setExitPressBar] = useState<number>(10); // bar
  const [gasType, setGasType] = useState<'real' | 'ideal'>('real');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animSpeed, setAnimSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Schematic Real Fluid Model Parameters (Nitrogen Empirical van der Waals Inversion Approximation)
  // Authoritative reference values for Nitrogen (N2): T_c = 126.2 K, P_c = 33.9 bar
  // Maximum inversion temperature T_inv,max ~ 620 K, maximum inversion pressure P_inv,max ~ 375 bar
  const maxInversionTemp = 620; // K
  const maxInversionPress = 375; // bar

  // Inversion curve boundary temperature at current inlet pressure P_1:
  // T_inv(P) = T_max * [1 - (P / P_max)^1.2]
  const pRatio = Math.min(1, inletPressBar / maxInversionPress);
  const boundaryTempAtP = useMemo(() => {
    return Math.max(0, maxInversionTemp * (1 - Math.pow(pRatio, 1.2)));
  }, [pRatio]);

  // Status check:
  // Cooling region: inside inversion dome (T1 < T_inv(P1))
  // Heating region: outside inversion dome (T1 > T_inv(P1))
  // Inversion boundary: T1 approx T_inv(P1)
  const isInsideInversionDome = initialTempK < boundaryTempAtP;
  const isNearInversionBoundary = Math.abs(initialTempK - boundaryTempAtP) < 15;

  // Exact Joule-Thomson coefficient calculation (K/bar):
  // For ideal gas: mu_JT = 0 identically
  // For real gas: mu_JT is positive inside dome, negative outside dome, 0 on boundary
  const mu_JT = useMemo(() => {
    if (gasType === 'ideal') return 0;
    // Calibrated Nitrogen empirical approximation: mu_JT ~ (T_inv(P) - T) / (Cp * rho)
    const factor = (boundaryTempAtP - initialTempK) / 320;
    return Math.round(factor * 1000) / 1000;
  }, [gasType, boundaryTempAtP, initialTempK]);

  // Pressure difference (dP < 0 for expansion)
  const deltaP = exitPressBar - inletPressBar;

  // Temperature change: dT = int(mu_JT dP) ~ mu_JT * deltaP
  const deltaT = useMemo(() => {
    if (gasType === 'ideal') return 0;
    const dt = mu_JT * deltaP;
    return Math.round(dt * 10) / 10;
  }, [gasType, mu_JT, deltaP]);

  // Exit temperature T2
  const exitTempK = useMemo(() => {
    if (gasType === 'ideal') return initialTempK;
    return Math.max(20, Math.round((initialTempK + deltaT) * 10) / 10);
  }, [gasType, initialTempK, deltaT]);

  // Presets
  const applyPreset = (preset: 'cooling' | 'heating' | 'ideal' | 'inversion_boundary') => {
    if (preset === 'cooling') {
      // Cryogenic throttling (Linde-Hampson cycle): N2 at 300K, 160 bar -> 1 bar
      setGasType('real');
      setInitialTempK(300);
      setInletPressBar(160);
      setExitPressBar(10);
    } else if (preset === 'heating') {
      // High-temperature inversion heating: T1 > T_inv,max -> mu_JT < 0
      setGasType('real');
      setInitialTempK(660);
      setInletPressBar(100);
      setExitPressBar(10);
    } else if (preset === 'ideal') {
      // Ideal gas benchmark: mu_JT = 0 identically -> T2 = T1
      setGasType('ideal');
      setInitialTempK(300);
      setInletPressBar(120);
      setExitPressBar(10);
    } else {
      // On the inversion boundary: mu_JT = 0 -> delta T ~ 0
      setGasType('real');
      setInletPressBar(100);
      setInitialTempK(480); // Near T_inv(100 bar) ~ 485 K
      setExitPressBar(10);
    }
  };

  // Reset
  const handleReset = () => {
    setGasType('real');
    setInitialTempK(300);
    setInletPressBar(120);
    setExitPressBar(10);
    setIsPlaying(true);
  };

  // Particles for Porous Plug Animation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);

  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 45; i++) {
      pts.push({
        x: 30 + Math.random() * 260,
        y: 20 + Math.random() * 70,
        vx: (1.2 + Math.random() * 1.8) * animSpeed,
        vy: (Math.random() - 0.5) * 0.8,
      });
    }
    particlesRef.current = pts;
  }, [animSpeed]);

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

      // Section 1: Top Porous Plug Animation (Pipe: Left: 30, Right: width-30, Top: 25, Bottom: 120)
      const pipeLeft = 30;
      const pipeRight = width - 30;
      const pipeTop = 25;
      const pipeBottom = 120;
      const pipeH = pipeBottom - pipeTop;
      const plugX = (pipeLeft + pipeRight) / 2 - 14;
      const plugW = 28;

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
      ctx.fillStyle = isLightTheme ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(pipeLeft, pipeTop + 2, plugX - pipeLeft, pipeH - 4);

      // Exit Color background (Throttled P2, T2)
      let exitColor = isLightTheme ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.2)';
      if (gasType === 'real') {
        if (deltaT < -0.5) {
          exitColor = isLightTheme ? 'rgba(6, 182, 212, 0.18)' : 'rgba(6, 182, 212, 0.25)';
        } else if (deltaT > 0.5) {
          exitColor = isLightTheme ? 'rgba(234, 88, 12, 0.18)' : 'rgba(234, 88, 12, 0.25)';
        }
      }
      ctx.fillStyle = exitColor;
      ctx.fillRect(plugX + plugW, pipeTop + 2, pipeRight - (plugX + plugW), pipeH - 4);

      // Draw Porous Plug restriction
      ctx.fillStyle = isLightTheme ? '#64748b' : '#334155';
      ctx.fillRect(plugX, pipeTop + 2, plugW, pipeH - 4);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;

      // Porous matrix pattern
      for (let py = pipeTop + 8; py < pipeBottom; py += 10) {
        for (let px = plugX + 5; px < plugX + plugW; px += 8) {
          ctx.fillStyle = isLightTheme ? '#0f172a' : '#020617';
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
        if (isPlaying) {
          p.x += p.vx;
          if (p.x > pipeRight - 6) {
            p.x = pipeLeft + 6;
            p.y = pipeTop + 10 + Math.random() * (pipeH - 20);
          }
        }

        const isPastPlug = p.x > plugX + plugW;
        let pColor = '#f87171'; // Inlet high pressure (warm red)
        if (isPastPlug) {
          if (gasType === 'ideal') {
            pColor = '#10b981'; // Constant temperature (green)
          } else if (deltaT < -0.5) {
            pColor = '#38bdf8'; // Cooling (cyan)
          } else if (deltaT > 0.5) {
            pColor = '#fb923c'; // Heating (orange)
          } else {
            pColor = '#10b981'; // No temp change
          }
        }

        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, isPastPlug ? 3 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Readouts above and below pipe
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`State 1 (Upstream): P₁ = ${inletPressBar} bar, T₁ = ${initialTempK} K`, pipeLeft + 8, pipeBottom + 18);

      let exitStatusColor = '#10b981';
      if (deltaT < -0.5) exitStatusColor = '#06b6d4';
      if (deltaT > 0.5) exitStatusColor = '#f97316';

      ctx.fillStyle = exitStatusColor;
      ctx.fillText(
        `State 2 (Downstream): P₂ = ${exitPressBar} bar, T₂ = ${exitTempK} K (ΔT = ${deltaT > 0 ? '+' : ''}${deltaT.toFixed(1)} K)`,
        plugX + plugW + 6,
        pipeBottom + 18
      );

      // Section 2: Bottom T-P Inversion Curve Plot
      const cLeft = 55;
      const cRight = width - 40;
      const cBottom = height - 35;
      const cTop = 165;
      const cW = cRight - cLeft;
      const cH = cBottom - cTop;

      const pToX = (p: number) => cLeft + (p / 400) * cW;
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
      ctx.fillText('Temperature T (K)', cLeft - 10, cTop - 6);
      ctx.fillText('Pressure P (bar) →', cRight - 60, cBottom + 22);

      // Inversion Curve Dome Fill (Cooling Zone)
      ctx.fillStyle = isLightTheme ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.08)';
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

      // Inversion curve label
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
      ctx.fillText('INVERSION CURVE (μ_JT = 0)', pToX(180), tToY(380));

      // Region Annotations
      ctx.fillStyle = isLightTheme ? '#0369a1' : '#38bdf8';
      ctx.fillText('COOLING REGION (μ_JT > 0, dT/dP > 0)', pToX(30), tToY(250));

      ctx.fillStyle = isLightTheme ? '#c2410c' : '#fb923c';
      ctx.fillText('HEATING REGION (μ_JT < 0, dT/dP < 0)', pToX(180), tToY(620));

      // Throttling Path Line (1 -> 2)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(pToX(inletPressBar), tToY(initialTempK));
      ctx.lineTo(pToX(exitPressBar), tToY(exitTempK));
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrow on throttling line
      const midX = (pToX(inletPressBar) + pToX(exitPressBar)) / 2;
      const midY = (tToY(initialTempK) + tToY(exitTempK)) / 2;
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Initial State Point 1
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(pToX(inletPressBar), tToY(initialTempK), 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`State 1 (${inletPressBar} bar, ${initialTempK} K)`, pToX(inletPressBar) + 8, tToY(initialTempK) - 4);

      // Exit State Point 2
      ctx.fillStyle = exitStatusColor;
      ctx.beginPath();
      ctx.arc(pToX(exitPressBar), tToY(exitTempK), 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
      ctx.fillText(`State 2 (${exitPressBar} bar, ${exitTempK} K)`, pToX(exitPressBar) + 8, tToY(exitTempK) - 4);

      if (isPlaying && shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animId);
  }, [
    initialTempK,
    inletPressBar,
    exitPressBar,
    gasType,
    deltaT,
    exitTempK,
    isDark,
    isPlaying,
    shouldAnimate,
    animSpeed,
    maxInversionPress,
    maxInversionTemp,
  ]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 shrink-0">
            <Wind className="w-5 h-5" />
          </div>
          <div>
            <h3 className="card-heading text-slate-900 dark:text-white">
              Joule-Thomson Throttling Valve & Inversion Curve Lab
            </h3>
            <p className="secondary-text text-slate-600 dark:text-slate-400">
              Isenthalpic throttling expansion (<MathView math="h_1 = h_2" />) through a porous plug comparing real-fluid inversion vs ideal gas behavior.
            </p>
          </div>
        </div>

        {/* Learning Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Real vs Ideal Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-900">
            <button
              onClick={() => setGasType('real')}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                gasType === 'real'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Real Fluid (<MathView math="N_2" />)
            </button>
            <button
              onClick={() => setGasType('ideal')}
              className={`min-h-[44px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                gasType === 'ideal'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Ideal Gas (<MathView math="\mu = 0" />)
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isPlaying ? 'Pause Particles' : 'Play Particles'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 text-teal-500" />}
          </button>

          <button
            onClick={handleReset}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reset to Initial Parameters"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Presets Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm">
        <span className="font-bold text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
          <Sliders className="w-4 h-4 text-teal-500" />
          Presets:
        </span>
        <button
          onClick={() => applyPreset('cooling')}
          className="min-h-[40px] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Cryogenic Cooling (<MathView math="\mu_{JT} > 0" />)
        </button>
        <button
          onClick={() => applyPreset('heating')}
          className="min-h-[40px] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Inversion Heating (<MathView math="\mu_{JT} < 0" />)
        </button>
        <button
          onClick={() => applyPreset('inversion_boundary')}
          className="min-h-[40px] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Inversion Boundary (<MathView math="\mu_{JT} = 0" />)
        </button>
        <button
          onClick={() => applyPreset('ideal')}
          className="min-h-[40px] px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Ideal Gas Benchmark (<MathView math="\Delta T = 0" />)
        </button>

        {/* Speed Selector */}
        <div className="ml-auto flex items-center gap-1.5 text-xs font-mono text-slate-500">
          <span>Speed:</span>
          {[0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => setAnimSpeed(s)}
              className={`min-h-[36px] min-w-[36px] px-2 py-1 rounded-lg ${
                animSpeed === s
                  ? 'bg-teal-600 text-white font-bold'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Canvas: Porous Plug Valve & T-P Inversion Plot */}
      <div className="bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={680}
          height={350}
          className="w-full max-w-[680px] h-auto rounded-xl shadow-inner"
        />
        <div className="text-[10px] text-slate-500 font-mono mt-2 text-center">
          *T-P Inversion curve plotted from Nitrogen empirical real-fluid approximation (<MathView math="T_{inv,max} \approx 620\text{ K}" />, <MathView math="P_{inv,max} \approx 375\text{ bar}" />).
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Inlet Pressure P1 */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Inlet Pressure (<MathView math="P_1" />)</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{inletPressBar} bar</span>
          </div>
          <input
            type="range"
            min={exitPressBar + 5}
            max="350"
            step="5"
            value={inletPressBar}
            onChange={(e) => setInletPressBar(parseFloat(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-rose-500 touch-pan-y"
          />
          <div className="secondary-text text-slate-500 font-mono">Upstream high-pressure reservoir</div>
        </div>

        {/* Exit Pressure P2 */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-teal-600 dark:text-teal-400">Exit Pressure (<MathView math="P_2" />)</span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{exitPressBar} bar</span>
          </div>
          <input
            type="range"
            min="1"
            max={inletPressBar - 5}
            step="1"
            value={exitPressBar}
            onChange={(e) => setExitPressBar(parseFloat(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-teal-500 touch-pan-y"
          />
          <div className="secondary-text text-slate-500 font-mono">Downstream throttled pressure (<MathView math="P_2 < P_1" />)</div>
        </div>

        {/* Initial Temperature T1 */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Inlet Temperature (<MathView math="T_1" />)</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {initialTempK} K ({(initialTempK - 273.15).toFixed(1)}°C)
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="750"
            step="10"
            value={initialTempK}
            onChange={(e) => setInitialTempK(parseFloat(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-slate-500 touch-pan-y"
          />
          <div className="secondary-text text-slate-500 font-mono">
            Boundary at <MathView math="P_1" />: <strong className="text-teal-600">{boundaryTempAtP.toFixed(0)} K</strong>
          </div>
        </div>
      </div>

      {/* Thermodynamic State Readout Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Joule-Thomson Coeff</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
            {gasType === 'ideal' ? '0.000' : `${mu_JT.toFixed(3)}`}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5"><MathView math="\mu_{JT} = (\partial T/\partial P)_h" /> [K/bar]</div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Pressure Drop (<MathView math="\Delta P" />)</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">{deltaP} bar</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5"><MathView math="P_2 - P_1 < 0" /> (expansion)</div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Temperature Change (<MathView math="\Delta T" />)</div>
          <div className={`text-lg sm:text-xl font-bold font-mono mt-1 ${deltaT < -0.5 ? 'text-cyan-600 dark:text-cyan-400' : deltaT > 0.5 ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {deltaT > 0 ? `+${deltaT.toFixed(1)}` : `${deltaT.toFixed(1)}`} K
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            {gasType === 'ideal' ? 'Ideal: ΔT = 0' : deltaT < -0.5 ? 'Cooling observed' : deltaT > 0.5 ? 'Heating observed' : 'Negligible ΔT'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Downstream Temp (<MathView math="T_2" />)</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
            {exitTempK} K
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{(exitTempK - 273.15).toFixed(1)} °C</div>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe={
          gasType === 'ideal'
            ? 'For an ideal gas, downstream temperature remains completely unchanged ($T_2 = T_1$) regardless of pressure drop.'
            : isInsideInversionDome
            ? 'Inside the inversion dome, throttling expansion ($dP < 0$) causes a temperature drop ($T_2 < T_1$), producing refrigeration.'
            : 'Above the inversion curve, throttling expansion ($dP < 0$) causes temperature to rise ($T_2 > T_1$), heating the gas.'
        }
        reason={
          gasType === 'ideal'
            ? 'In an ideal gas, internal energy and enthalpy depend only on temperature ($h = h(T)$). Since throttling is isenthalpic ($h_1 = h_2$), $T_2 = T_1$ strictly.'
            : isInsideInversionDome
            ? 'At lower temperatures, intermolecular attractive van der Waals forces dominate. As the gas expands, work is done against these attractive forces using internal kinetic energy, causing the temperature to drop.'
            : 'At high temperatures, molecular kinetic energy overcomes attraction, and repulsive molecular core interactions dominate during expansion, releasing thermal energy and raising temperature.'
        }
        takeaway="Throttling is always isenthalpic ($h_1 = h_2$), but NOT isothermal for real gases. Remember: cooling only occurs when $\mu_{JT} > 0$ (inside inversion curve). On the inversion curve, $\mu_{JT} = 0$."
        governingEquation="\mu_{JT} = \left(\frac{\partial T}{\partial P}\right)_h = \frac{1}{C_p}\left[T\left(\frac{\partial v}{\partial T}\right)_P - v\right]"
        stateValues={[
          { label: 'μ_JT', value: `${mu_JT.toFixed(3)}`, unit: 'K/bar', highlight: true },
          { label: 'P_1 → P_2', value: `${inletPressBar} → ${exitPressBar}`, unit: 'bar' },
          { label: 'T_1 → T_2', value: `${initialTempK} → ${exitTempK}`, unit: 'K' },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card (Repairs Screenshot Issue) */}
      <RevisionCard
        title="Joule–Thomson Effect & Inversion Curve"
        badge="THERMODYNAMIC RELATIONS REVISION"
        explanation="Throttling is a steady-flow expansion through a flow restriction such as a porous plug, cracked valve, or capillary tube. With negligible heat transfer, shaft work, and kinetic/potential energy changes, the process is strictly isenthalpic ($h_1 = h_2$)."
        equation="\mu_{JT} = \left(\frac{\partial T}{\partial P}\right)_h = \frac{1}{C_p}\left[T\left(\frac{\partial v}{\partial T}\right)_P - v\right]"
        secondaryEquation="h_1 = h_2 \quad (\text{Steady-Flow Throttling: } q = 0, \; w = 0, \; \Delta ke \approx 0)"
        specialCases={[
          {
            label: 'Ideal Gas Behavior',
            condition: '\mu_{JT} \equiv 0 \implies T_2 = T_1',
            result: 'For an ideal gas, $Pv = RT \implies (\partial v/\partial T)_P = v/T$, giving $\mu_{JT} = 0$ everywhere (zero temperature change upon throttling).',
          },
          {
            label: 'Cooling Region (Inside Dome)',
            condition: 'T_1 < T_{\text{inv}}(P_1) \implies \mu_{JT} > 0',
            result: 'Because pressure drops during throttling ($dP < 0$), $dT = \mu_{JT} dP < 0$, causing temperature to fall ($T_2 < T_1$). Basis of cryogenic Linde-Hampson liquefaction.',
          },
          {
            label: 'Heating Region (Outside Dome)',
            condition: 'T_1 > T_{\text{inv}}(P_1) \implies \mu_{JT} < 0',
            result: 'With negative coefficient, throttling pressure drop causes temperature to rise ($T_2 > T_1$). Hydrogen and helium heat upon throttling at room temperature.',
          },
          {
            label: 'Inversion Curve Boundary',
            condition: '\mu_{JT} = 0 \implies \Delta T = 0',
            result: 'Locus of states where isenthalpic curves reach peak temperature. The maximum inversion temperature is $T_{\text{inv,max}} \approx 6.75\, T_c$ (for van der Waals gas).',
          },
        ]}
        symbols={[
          { symbol: '\mu_{JT}', name: 'Joule-Thomson Coefficient', unit: 'K/bar or K/kPa', description: 'Slope of isenthalpic curves on T-P coordinates: (∂T/∂P)_h' },
          { symbol: 'C_p', name: 'Constant-Pressure Specific Heat', unit: 'kJ/(kg·K)', description: 'Specific heat capacity at constant pressure' },
          { symbol: 'T', name: 'Absolute Temperature', unit: 'K', description: 'Fluid temperature in Kelvin' },
          { symbol: 'v', name: 'Specific Volume', unit: 'm³/kg', description: 'Volume occupied per unit mass of substance' },
          { symbol: 'P', name: 'Fluid Pressure', unit: 'bar or kPa', description: 'Static pressure before and after restriction' },
          { symbol: 'h', name: 'Specific Enthalpy', unit: 'kJ/kg', description: 'Property conserved across adiabatic steady throttling' },
        ]}
        takeaway="Throttling is always isenthalpic ($h_1 = h_2$) and highly irreversible ($s_2 > s_1$). Real fluids only cool if throttled from states inside their inversion curve ($\mu_{JT} > 0$). Ideal gases never change temperature upon throttling."
        validity="Applies to steady-flow adiabatic throttling of compressible fluids across porous plugs, capillary tubes, and expansion valves with negligible kinetic energy change ($\Delta ke \approx 0$)."
        variant="cyan"
      />
    </div>
  );
};
