import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Activity,
  Flame,
  Snowflake,
  Sliders,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Layers,
  StepForward,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
  CartesianGrid,
} from 'recharts';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export type ThermodynamicProcess = 'isothermal' | 'isobaric' | 'isochoric' | 'adiabatic' | 'free';

export const PistonCylinderSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);

  // Process Mode
  const [processType, setProcessType] = useState<ThermodynamicProcess>('isothermal');

  // System State Variables
  const [temperature, setTemperature] = useState<number>(350); // Kelvin (200K - 750K)
  const [volume, setVolume] = useState<number>(0.05); // m^3 (0.02 to 0.10)
  const [moles, setMoles] = useState<number>(2.0); // mol
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animSpeed, setAnimSpeed] = useState<number>(1.0);

  // Initial reference state (State 1)
  const [state1, setState1] = useState<{ P: number; V: number; T: number }>({
    P: 145.5,
    V: 0.04,
    T: 350,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Universal gas constant R = 8.314 J/(mol·K)
  // Specific heat ratio for diatomic gas (Air, N2, O2): gamma = 1.4
  // Cv = R / (gamma - 1) = 2.5 * R = 20.785 J/(mol·K)
  // Cp = gamma * Cv = 3.5 * R = 29.099 J/(mol·K)
  const R = 8.314;
  const gamma = 1.4;
  const Cv = R / (gamma - 1);
  const Cp = gamma * Cv;

  // Pressure calculation: P = (n * R * T) / V  (in kPa)
  const currentPressureKPa = useMemo(() => {
    const pPa = (moles * R * temperature) / volume;
    return Math.round((pPa / 1000) * 10) / 10;
  }, [moles, temperature, volume]);

  // Work, Heat, and Delta U calculations relative to state 1:
  // Sign convention: Q_in > 0 (heat added), W_out > 0 (work produced by gas), Delta U = Q - W
  const processCalculations = useMemo(() => {
    const V1 = state1.V;
    const V2 = volume;
    const T1 = state1.T;
    const T2 = temperature;
    const P1_Pa = (moles * R * T1) / V1;
    const P2_Pa = (moles * R * T2) / V2;

    let workKJ = 0;
    let heatKJ = 0;
    const deltaUKJ = ((moles * Cv * (T2 - T1)) / 1000);

    if (processType === 'isothermal') {
      // W = n R T ln(V2 / V1), Delta U = 0, Q = W
      workKJ = ((moles * R * T1 * Math.log(V2 / V1)) / 1000);
      heatKJ = workKJ;
    } else if (processType === 'isobaric') {
      // W = P (V2 - V1), Q = n Cp (T2 - T1)
      workKJ = ((P1_Pa * (V2 - V1)) / 1000);
      heatKJ = ((moles * Cp * (T2 - T1)) / 1000);
    } else if (processType === 'isochoric') {
      // W = 0, Q = Delta U = n Cv (T2 - T1)
      workKJ = 0;
      heatKJ = deltaUKJ;
    } else if (processType === 'adiabatic') {
      // Q = 0, W = -Delta U = (P1 V1 - P2 V2) / (gamma - 1)
      heatKJ = 0;
      workKJ = -deltaUKJ;
    } else {
      workKJ = ((P1_Pa + P2_Pa) / 2 * (V2 - V1)) / 1000;
      heatKJ = deltaUKJ + workKJ;
    }

    return {
      workKJ: Math.round(workKJ * 100) / 100,
      heatKJ: Math.round(heatKJ * 100) / 100,
      deltaUKJ: Math.round(deltaUKJ * 100) / 100,
    };
  }, [processType, state1, volume, temperature, moles, Cv, Cp]);

  // Handler for volume slider
  const handleVolumeSlider = (newV: number) => {
    if (processType === 'isochoric') return; // V is constant in isochoric

    setVolume(newV);

    if (processType === 'isothermal') {
      // T is constant; P adjusts naturally via P = nRT/V
    } else if (processType === 'isobaric') {
      // P is constant: V / T = const -> T = T1 * (V / V1)
      const targetT = state1.T * (newV / state1.V);
      setTemperature(Math.min(800, Math.max(150, Math.round(targetT))));
    } else if (processType === 'adiabatic') {
      // P V^gamma = const -> T V^(gamma - 1) = const -> T = T1 * (V1 / V2)^(gamma - 1)
      const targetT = state1.T * Math.pow(state1.V / newV, gamma - 1);
      setTemperature(Math.min(850, Math.max(150, Math.round(targetT))));
    }
  };

  // Handler for temperature slider
  const handleTempSlider = (newT: number) => {
    if (processType === 'isothermal') return; // T is constant in isothermal

    setTemperature(newT);

    if (processType === 'isobaric') {
      // P is constant: V / T = const -> V = V1 * (T / T1)
      const targetV = state1.V * (newT / state1.T);
      setVolume(Math.min(0.10, Math.max(0.02, Math.round(targetV * 1000) / 1000)));
    } else if (processType === 'isochoric') {
      // V is constant: P / T = const
    } else if (processType === 'adiabatic') {
      // T V^(gamma - 1) = const -> V = V1 * (T1 / T)^(1 / (gamma - 1))
      const targetV = state1.V * Math.pow(state1.T / newT, 1 / (gamma - 1));
      setVolume(Math.min(0.10, Math.max(0.02, Math.round(targetV * 1000) / 1000)));
    }
  };

  // Switch Process Presets
  const setProcessMode = (mode: ThermodynamicProcess) => {
    setProcessType(mode);
    const vInit = 0.04;
    const tInit = 350;
    const pInit = Math.round(((moles * R * tInit) / vInit / 1000) * 10) / 10;

    setState1({ P: pInit, V: vInit, T: tInit });
    setVolume(vInit);
    setTemperature(tInit);
  };

  // Reset
  const handleReset = () => {
    setProcessMode('isothermal');
    setIsPlaying(true);
  };

  // Generate P-V Plot Curve
  const pvPlotData = useMemo(() => {
    const pts = [];
    const minV = 0.02;
    const maxV = 0.10;
    const numPoints = 25;

    for (let i = 0; i <= numPoints; i++) {
      const vPt = minV + (i / numPoints) * (maxV - minV);
      let pPt = 0;

      if (processType === 'isothermal') {
        // P = n R T / V
        pPt = (moles * R * state1.T) / vPt / 1000;
      } else if (processType === 'isobaric') {
        // P = P1 = const
        pPt = state1.P;
      } else if (processType === 'isochoric') {
        // Line will be vertical at V = V1, but on function graph we show locus
        pPt = (moles * R * temperature) / state1.V / 1000;
      } else if (processType === 'adiabatic') {
        // P = P1 * (V1 / V)^gamma
        pPt = state1.P * Math.pow(state1.V / vPt, gamma);
      } else {
        pPt = (moles * R * temperature) / vPt / 1000;
      }

      pts.push({
        v: Math.round(vPt * 1000) / 1000,
        v_L: Math.round(vPt * 1000), // in Liters
        p_kPa: Math.round(pPt * 10) / 10,
      });
    }
    return pts;
  }, [processType, state1, moles, temperature]);

  // Particles ref for canvas animation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);

  useEffect(() => {
    const pts = [];
    const count = Math.min(50, Math.round(moles * 18));
    for (let i = 0; i < count; i++) {
      pts.push({
        x: 45 + Math.random() * 150,
        y: 45 + Math.random() * 140,
        vx: (Math.random() - 0.5) * 2.2 * animSpeed,
        vy: (Math.random() - 0.5) * 2.2 * animSpeed,
        radius: 3.5,
      });
    }
    particlesRef.current = pts;
  }, [moles, animSpeed]);

  // Canvas Piston Assembly & Particle Motion
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

      const isLightTheme = !isDark;
      const bg = isLightTheme ? '#f8fafc' : '#090d16';
      const cylinderBorder = isLightTheme ? '#475569' : '#94a3b8';
      const gasGlow = isLightTheme ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.12)';

      // Background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Cylinder dimensions: Left=45, Right=width-45, Bottom=height-35, Top=35
      const cylLeft = 45;
      const cylRight = width - 45;
      const cylBottom = height - 38;
      const cylTop = 32;
      const cylHeight = cylBottom - cylTop;
      const cylWidth = cylRight - cylLeft;

      // Direct physical connection: Piston movement tied directly to Volume (0.02 to 0.10 m^3)
      const vFraction = (volume - 0.02) / (0.10 - 0.02);
      const pistonY = cylBottom - (vFraction * (cylHeight - 35) + 35);

      // Draw Gas Volume interior
      ctx.fillStyle = gasGlow;
      ctx.fillRect(cylLeft + 4, pistonY, cylWidth - 8, cylBottom - pistonY);

      // Heating / Cooling effect at bottom
      const isHeating = processCalculations.heatKJ > 0.1;
      const isCooling = processCalculations.heatKJ < -0.1;

      if (isHeating) {
        // Red thermal addition glow
        const flameGrad = ctx.createLinearGradient(cylLeft, cylBottom, cylLeft, cylBottom - 40);
        flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
        flameGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
        ctx.fillStyle = flameGrad;
        ctx.fillRect(cylLeft + 4, cylBottom - 40, cylWidth - 8, 40);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        ctx.fillText('HEAT ADDITION (Q_in > 0)', cylLeft + 20, cylBottom + 20);
      } else if (isCooling) {
        // Blue cooling rejection glow
        const coolGrad = ctx.createLinearGradient(cylLeft, cylBottom, cylLeft, cylBottom - 40);
        coolGrad.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
        coolGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = coolGrad;
        ctx.fillRect(cylLeft + 4, cylBottom - 40, cylWidth - 8, 40);

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        ctx.fillText('HEAT REJECTION (Q_out > 0)', cylLeft + 20, cylBottom + 20);
      } else if (processType === 'adiabatic') {
        // Insulated boundary
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        ctx.fillText('PERFECT THERMAL INSULATION (Q = 0)', cylLeft + 15, cylBottom + 20);
      }

      // Draw Cylinder Walls (U-shape)
      ctx.strokeStyle = cylinderBorder;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cylLeft, cylTop);
      ctx.lineTo(cylLeft, cylBottom);
      ctx.lineTo(cylRight, cylBottom);
      ctx.lineTo(cylRight, cylTop);
      ctx.stroke();

      // Piston Head & Piston Rod
      const pistonThickness = 14;
      ctx.fillStyle = isLightTheme ? '#0284c7' : '#38bdf8';
      ctx.fillRect(cylLeft + 4, pistonY, cylWidth - 8, pistonThickness);

      ctx.strokeStyle = isLightTheme ? '#0369a1' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(cylLeft + 4, pistonY, cylWidth - 8, pistonThickness);

      // Piston Rod extending up
      const rodW = 16;
      ctx.fillStyle = isLightTheme ? '#64748b' : '#475569';
      ctx.fillRect(cylLeft + cylWidth / 2 - rodW / 2, pistonY - 45, rodW, 45);

      // Work arrow indicator on piston rod
      const isExpanding = volume > state1.V + 0.001;
      const isCompressing = volume < state1.V - 0.001;
      if (isExpanding) {
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillText('↑ EXPANSION (W_out > 0)', cylLeft + cylWidth / 2 + 15, pistonY - 20);
      } else if (isCompressing) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillText('↓ COMPRESSION (W_in > 0)', cylLeft + cylWidth / 2 + 15, pistonY - 20);
      }

      // Draw Gas Particles
      const particleSpeed = Math.sqrt(temperature / 300) * 1.5 * animSpeed;
      const pts = particlesRef.current;
      ctx.fillStyle = isLightTheme ? '#0284c7' : '#38bdf8';

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (isPlaying) {
          p.x += p.vx * particleSpeed;
          p.y += p.vy * particleSpeed;

          // Wall bounces
          if (p.x < cylLeft + 8) {
            p.x = cylLeft + 8;
            p.vx = Math.abs(p.vx);
          } else if (p.x > cylRight - 8) {
            p.x = cylRight - 8;
            p.vx = -Math.abs(p.vx);
          }

          if (p.y < pistonY + pistonThickness + 4) {
            p.y = pistonY + pistonThickness + 4;
            p.vy = Math.abs(p.vy);
          } else if (p.y > cylBottom - 8) {
            p.y = cylBottom - 8;
            p.vy = -Math.abs(p.vy);
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Volume & Pressure indicators
      ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 11px Fira Code, monospace';
      ctx.fillText(`V = ${(volume * 1000).toFixed(1)} L (${volume.toFixed(3)} m³)`, cylLeft + 10, cylTop + 14);
      ctx.fillText(`P = ${currentPressureKPa.toFixed(1)} kPa`, cylRight - 130, cylTop + 14);

      if (isPlaying && shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(render);
    } else {
      render();
    }
    return () => cancelAnimationFrame(animId);
  }, [volume, temperature, currentPressureKPa, isDark, isPlaying, processType, processCalculations, state1, animSpeed, shouldAnimate]);

  return (
    <div ref={containerRef} className="space-y-4 md:space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[18px] md:text-[20px] font-bold text-slate-900 dark:text-white leading-[1.3]">
              Piston–Cylinder Assembly & Thermodynamic Processes
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
              Synchronized displacement work <MathView math="W = \int P dV" />, gas laws, and energy balance for isothermal, isobaric, isochoric, and adiabatic processes.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            title={isPlaying ? 'Pause Motion' : 'Play Motion'}
            aria-label={isPlaying ? 'Pause Motion' : 'Play Motion'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-teal-500" />}
          </button>

          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center"
            title="Reset to Initial State"
            aria-label="Reset State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Process Selection Pills */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">
        <span className="font-bold text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-teal-500" />
          Process Type:
        </span>

        <button
          onClick={() => setProcessMode('isothermal')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            processType === 'isothermal'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500'
          }`}
        >
          Isothermal (<MathView math="T = \text{const}" />)
        </button>

        <button
          onClick={() => setProcessMode('isobaric')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            processType === 'isobaric'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500'
          }`}
        >
          Isobaric (<MathView math="P = \text{const}" />)
        </button>

        <button
          onClick={() => setProcessMode('isochoric')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            processType === 'isochoric'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500'
          }`}
        >
          Isochoric (<MathView math="V = \text{const}" />)
        </button>

        <button
          onClick={() => setProcessMode('adiabatic')}
          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            processType === 'adiabatic'
              ? 'bg-teal-600 text-white shadow-xs font-bold'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-500'
          }`}
        >
          Adiabatic (<MathView math="PV^{1.4} = \text{const}" />)
        </button>
      </div>

      {/* Main Assembly View & Live P-V Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Dynamic Piston Cylinder Assembly (6 cols) */}
        <div className="lg:col-span-6 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={380}
            height={270}
            className="w-full max-w-[380px] h-auto rounded-xl shadow-inner"
          />
          <div className="flex items-center justify-between w-full mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 px-2">
            <span>Piston Displacement: <strong className="text-slate-900 dark:text-white">{(volume / 0.001).toFixed(0)} mm</strong></span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">
              {processType.toUpperCase()}
            </span>
            <span><MathView math={`T = ${temperature}\\text{ K}`} /></span>
          </div>
        </div>

        {/* Right: Synchronized P-V Property Curve (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Synchronized P-V Diagram (<MathView math="W = \int P dV" />)</span>
            </h4>
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
              State Point: ({volume.toFixed(3)} m³, {currentPressureKPa.toFixed(0)} kPa)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pvPlotData} margin={{ top: 10, right: 20, left: -5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  dataKey="v"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Volume V (m³)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
                />
                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'P (kPa)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="p_kPa"
                  name="Process Path"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={false}
                />
                {/* State 1 Reference Dot */}
                <ReferenceDot
                  x={state1.V}
                  y={state1.P}
                  r={5}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                {/* Current State 2 Tracer Dot */}
                <ReferenceDot
                  x={volume}
                  y={currentPressureKPa}
                  r={6}
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 font-mono text-center">
            Yellow dot = State 1 (Reference) | Cyan dot = State 2 (Current)
          </div>
        </div>
      </div>

      {/* Sliders for Volume and Temperature */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Volume Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              Volume (<MathView math="V" />)
            </span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
              {(volume * 1000).toFixed(1)} L ({volume.toFixed(3)} m³)
            </span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.10"
            step="0.002"
            value={volume}
            disabled={processType === 'isochoric'}
            onChange={(e) => handleVolumeSlider(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500 disabled:opacity-40"
          />
          <div className="text-[10px] text-slate-500 font-mono">
            {processType === 'isochoric' ? 'Volume is fixed in isochoric process (dV = 0)' : 'Moves piston head and integrates boundary work'}
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              Temperature (<MathView math="T" />)
            </span>
            <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
              {temperature} K ({(temperature - 273.15).toFixed(1)} °C)
            </span>
          </div>
          <input
            type="range"
            min="200"
            max="750"
            step="5"
            value={temperature}
            disabled={processType === 'isothermal'}
            onChange={(e) => handleTempSlider(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-40"
          />
          <div className="text-[10px] text-slate-500 font-mono">
            {processType === 'isothermal' ? 'Temperature is fixed in isothermal process (dT = 0)' : 'Controls thermal excitation and particle speeds'}
          </div>
        </div>
      </div>

      {/* Thermodynamic First Law Energy Balance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Boundary Work (<MathView math="W" />)</div>
          <div className={`text-lg font-bold font-mono ${processCalculations.workKJ > 0 ? 'text-emerald-600 dark:text-emerald-400' : processCalculations.workKJ < 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {processCalculations.workKJ > 0 ? `+${processCalculations.workKJ}` : `${processCalculations.workKJ}`} kJ
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {processCalculations.workKJ > 0 ? 'Expansion (by gas)' : processCalculations.workKJ < 0 ? 'Compression (on gas)' : 'Zero Work (dV = 0)'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Heat Transfer (<MathView math="Q" />)</div>
          <div className={`text-lg font-bold font-mono ${processCalculations.heatKJ > 0 ? 'text-rose-600 dark:text-rose-400' : processCalculations.heatKJ < 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'}`}>
            {processCalculations.heatKJ > 0 ? `+${processCalculations.heatKJ}` : `${processCalculations.heatKJ}`} kJ
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            {processCalculations.heatKJ > 0 ? 'Heat Added (+Q)' : processCalculations.heatKJ < 0 ? 'Heat Rejected (-Q)' : 'Adiabatic (Q = 0)'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Internal Energy (<MathView math="\Delta U" />)</div>
          <div className="text-lg font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {processCalculations.deltaUKJ > 0 ? `+${processCalculations.deltaUKJ}` : `${processCalculations.deltaUKJ}`} kJ
          </div>
          <div className="text-[10px] text-slate-500 font-mono"><MathView math="\Delta U = n C_v \Delta T" /></div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">First Law Check</div>
          <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400">
            <MathView math="Q - W = \Delta U" />
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Sign: <MathView math="Q_{\text{in}} > 0, \; W_{\text{out}} > 0" /></div>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe={
          processType === 'isothermal'
            ? 'As volume expands, pressure drops inversely such that $P \cdot V = \text{const}$. Temperature remains strictly unchanged.'
            : processType === 'isobaric'
            ? 'Heating the gas pushes the piston up, increasing volume in direct proportion to temperature ($V/T = \text{const}$) at constant pressure.'
            : processType === 'isochoric'
            ? 'Because the piston is locked ($dV = 0$), heating raises pressure directly with temperature ($P/T = \text{const}$) with strictly zero boundary work.'
            : 'During adiabatic expansion ($Q = 0$), gas does work entirely at the expense of its own internal energy, causing temperature and pressure to drop sharply ($P V^{1.4} = \text{const}$).'
        }
        reason={
          processType === 'isothermal'
            ? 'For an ideal gas, $\Delta U = 0$ when $\Delta T = 0$. By the First Law ($Q = W$), all heat absorbed from the thermal bath is completely converted into boundary displacement work.'
            : processType === 'isobaric'
            ? 'The external load on the piston is constant ($F = P \cdot A$). Heat addition expands the gas, performing boundary work $W = P\Delta V$ while simultaneously raising internal energy.'
            : processType === 'isochoric'
            ? 'Since boundary displacement work is $W = \int P dV$, a rigid container with $dV = 0$ performs zero work. All supplied heat directly increases internal thermal energy.'
            : 'Perfect thermal insulation prevents heat exchange ($Q = 0$). By First Law, $W = -\Delta U = -n C_v \Delta T$; work extracted from expanding molecules directly depletes their kinetic energy.'
        }
        takeaway={
          processType === 'isothermal'
            ? 'Isothermal work: $W = nRT \ln(V_2/V_1) = P_1 V_1 \ln(V_2/V_1)$ with $\Delta U = 0 \implies Q = W$.'
            : processType === 'isobaric'
            ? 'Isobaric work: $W = P(V_2 - V_1) = nR(T_2 - T_1)$ with $Q = n C_p \Delta T = \Delta H$.'
            : processType === 'isochoric'
            ? 'Isochoric process: $W = 0$, $Q = \Delta U = n C_v \Delta T$. Slope on P-V plane is vertical ($\infty$).'
            : 'Adiabatic process: $P_1 V_1^\gamma = P_2 V_2^\gamma$ and $W = \frac{P_1 V_1 - P_2 V_2}{\gamma - 1}$. Adiabatic curves are steeper than isothermal curves on P-V coordinates by a factor of $\gamma$.'
        }
        governingEquation={
          processType === 'isothermal'
            ? 'P_1 V_1 = P_2 V_2 = nRT'
            : processType === 'isobaric'
            ? '\\frac{V_1}{T_1} = \\frac{V_2}{T_2}'
            : processType === 'isochoric'
            ? '\\frac{P_1}{T_1} = \\frac{P_2}{T_2}'
            : 'P_1 V_1^{\\gamma} = P_2 V_2^{\\gamma} \\quad (\\gamma = 1.4)'
        }
        stateValues={[
          { label: 'P', value: `${currentPressureKPa}`, unit: 'kPa' },
          { label: 'V', value: `${(volume * 1000).toFixed(1)}`, unit: 'L' },
          { label: 'T', value: `${temperature}`, unit: 'K' },
          { label: 'W', value: `${processCalculations.workKJ}`, unit: 'kJ', highlight: true },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Quasi-Static Closed System Processes & Boundary Work"
        badge="FIRST LAW PROCESS REVISION"
        explanation="For a simple compressible system undergoing a quasi-static displacement, boundary work is evaluated by integrating pressure over volume change ($W = \int P dV$). The First Law states that net heat added minus work produced equals the change in internal energy ($\Delta U = Q - W$)."
        equation="W = \int_{V_1}^{V_2} P \, dV \quad \text{and} \quad \Delta U = Q - W"
        secondaryEquation="\text{Sign Convention: } Q_{\text{in}} > 0 \; (\text{Heat in}), \quad W_{\text{out}} > 0 \; (\text{Work done by gas}), \quad \Delta U = n C_v \Delta T"
        specialCases={[
          {
            label: '1. Isothermal Process (T = const)',
            condition: 'P_1 V_1 = P_2 V_2 = nRT',
            result: 'Work: $W = nRT \\ln\\left(\\frac{V_2}{V_1}\\right) = P_1 V_1 \\ln\\left(\\frac{P_1}{P_2}\\right)$. Internal energy: $\\Delta U = 0 \\implies Q = W$.',
          },
          {
            label: '2. Isobaric Process (P = const)',
            condition: '\\frac{V_1}{T_1} = \\frac{V_2}{T_2}',
            result: 'Work: $W = P(V_2 - V_1) = nR(T_2 - T_1)$. Heat: $Q = n C_p (T_2 - T_1) = \\Delta H$. Internal energy: $\\Delta U = Q - W$.',
          },
          {
            label: '3. Isochoric Process (V = const)',
            condition: '\\frac{P_1}{T_1} = \\frac{P_2}{T_2}',
            result: 'Work: $W = \\int P dV = 0$ identically. Heat: $Q = \\Delta U = n C_v (T_2 - T_1)$. The boundary does not move.',
          },
          {
            label: '4. Reversible Adiabatic (Q = 0)',
            condition: 'P_1 V_1^{\\gamma} = P_2 V_2^{\\gamma} \\quad (\\gamma = 1.4)',
            result: 'Work: $W = \\frac{P_1 V_1 - P_2 V_2}{\\gamma - 1} = -\\Delta U$. Temperature: $T_1 V_1^{\\gamma - 1} = T_2 V_2^{\\gamma - 1}$. Stored internal energy produces the work.',
          },
        ]}
        symbols={[
          { symbol: 'W', name: 'Boundary Displacement Work', unit: 'kJ', description: 'Area under the process curve on P-V diagram: ∫PdV' },
          { symbol: 'Q', name: 'Heat Transferred', unit: 'kJ', description: 'Thermal energy crossing closed system boundary' },
          { symbol: '\Delta U', name: 'Change in Internal Energy', unit: 'kJ', description: 'Point function state change: n Cv (T2 - T1)' },
          { symbol: 'P', name: 'Absolute Pressure', unit: 'kPa or bar', description: 'Force per unit area exerted by gas molecules' },
          { symbol: 'V', name: 'System Volume', unit: 'm³ or Liters', description: 'Geometric enclosure volume bounded by moving piston' },
          { symbol: '\gamma', name: 'Specific Heat Ratio', unit: '1.4 [-]', description: 'Ratio Cp / Cv for diatomic ideal gases' },
        ]}
        takeaway="Work and Heat are PATH functions and inexact differentials (δW, δQ). Their values depend on the specific path between states 1 and 2. Conversely, Internal Energy U, Enthalpy H, and Entropy S are POINT functions; their cyclic integral is always zero (∮ d(Property) = 0)."
        validity="Valid for quasi-static (frictionless, infinitely slow equilibrium) processes of ideal gas enclosed in a leak-free piston-cylinder assembly."
        variant="amber"
      />
    </div>
  );
};
