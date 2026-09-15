import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Gauge, Activity, Flame, Sliders, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, AreaChart, Area, CartesianGrid } from 'recharts';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

export const PistonCylinderSim: React.FC = () => {
  const { isDark } = useTheme();

  // Control mode:
  // 'free': User changes V, T, n and P is calculated from P = nRT / V
  // 'isothermal': T constant, change V -> P updates
  // 'isobaric': P constant, change T -> V updates
  // 'isochoric': V constant, change T -> P updates
  const [mode, setMode] = useState<'free' | 'isothermal' | 'isobaric' | 'isochoric'>('free');

  const [temperature, setTemperature] = useState<number>(300); // Kelvin (200K - 800K)
  const [volume, setVolume] = useState<number>(0.05); // m^3 (0.02 to 0.10)
  const [moles, setMoles] = useState<number>(2.0); // mol (0.5 to 5.0)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Universal gas constant R = 8.314 J/(mol·K)
  const R = 8.314;

  // Pressure calculation: P = (n * R * T) / V  (in Pascals -> kPa)
  const pressureKPa = useMemo(() => {
    const pPa = (moles * R * temperature) / volume;
    return Math.round((pPa / 1000) * 10) / 10; // in kPa
  }, [moles, temperature, volume]);

  // Handle slider changes based on mode
  const handleVolumeChange = (newV: number) => {
    setVolume(newV);
  };

  const handleTempChange = (newT: number) => {
    setTemperature(newT);
    if (mode === 'isobaric') {
      // V = nRT / P (keep current P constant)
      const targetP_Pa = (moles * R * temperature) / volume;
      const targetV = (moles * R * newT) / targetP_Pa;
      setVolume(Math.min(0.1, Math.max(0.02, Math.round(targetV * 1000) / 1000)));
    }
  };

  const handleMolesChange = (newN: number) => {
    setMoles(newN);
  };

  // Particles ref for canvas animation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number }>>([]);

  useEffect(() => {
    const pts = [];
    const count = Math.min(60, Math.round(moles * 15));
    for (let i = 0; i < count; i++) {
      pts.push({
        x: 40 + Math.random() * 150,
        y: 40 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 3.5,
      });
    }
    particlesRef.current = pts;
  }, [moles]);

  // Canvas Piston & Particle Animation
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
      const pistonColor = isLightTheme ? '#0284c7' : '#38bdf8';
      const gasGlow = isLightTheme ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.12)';

      // Draw background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Cylinder dimensions: Left=40, Right=280, Bottom=height-35, Top=35
      const cylLeft = 45;
      const cylRight = width - 45;
      const cylBottom = height - 40;
      const cylTop = 35;
      const cylHeight = cylBottom - cylTop;
      const cylWidth = cylRight - cylLeft;

      // Piston position derived from volume (0.02m^3 -> bottom, 0.10m^3 -> top)
      // vFraction 0 to 1
      const vFraction = (volume - 0.02) / (0.10 - 0.02);
      const pistonY = cylBottom - (vFraction * (cylHeight - 35) + 35);

      // Draw Cylinder Gas Volume (Interior)
      ctx.fillStyle = gasGlow;
      ctx.fillRect(cylLeft + 4, pistonY, cylWidth - 8, cylBottom - pistonY);

      // Draw Thermal Gradient glow at bottom
      const tempHeatFrac = (temperature - 200) / 600;
      const flameGrad = ctx.createLinearGradient(cylLeft, cylBottom, cylLeft, cylBottom - 40);
      flameGrad.addColorStop(0, `rgba(244, 63, 94, ${0.15 + tempHeatFrac * 0.35})`);
      flameGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = flameGrad;
      ctx.fillRect(cylLeft + 4, cylBottom - 40, cylWidth - 8, 40);

      // Draw Cylinder Walls (U-shape)
      ctx.strokeStyle = cylinderBorder;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cylLeft, cylTop);
      ctx.lineTo(cylLeft, cylBottom);
      ctx.lineTo(cylRight, cylBottom);
      ctx.lineTo(cylRight, cylTop);
      ctx.stroke();

      // Draw Hatch lines on outside of cylinder walls for engineering look
      ctx.strokeStyle = isLightTheme ? '#cbd5e1' : '#334155';
      ctx.lineWidth = 1.5;
      for (let y = cylTop + 10; y < cylBottom; y += 15) {
        ctx.beginPath();
        ctx.moveTo(cylLeft - 10, y + 8);
        ctx.lineTo(cylLeft, y);
        ctx.moveTo(cylRight, y);
        ctx.lineTo(cylRight + 10, y - 8);
        ctx.stroke();
      }
      for (let x = cylLeft; x < cylRight; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, cylBottom);
        ctx.lineTo(x - 8, cylBottom + 10);
        ctx.stroke();
      }

      // Draw Gas Particles
      const speed = Math.sqrt(temperature / 300) * 1.6;
      const pts = particlesRef.current;
      ctx.fillStyle = isLightTheme ? '#0284c7' : '#38bdf8';

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        if (isPlaying) {
          p.x += p.vx * speed;
          p.y += p.vy * speed;

          // Boundary collisions
          if (p.x < cylLeft + 8) {
            p.x = cylLeft + 8;
            p.vx = Math.abs(p.vx);
          } else if (p.x > cylRight - 8) {
            p.x = cylRight - 8;
            p.vx = -Math.abs(p.vx);
          }

          if (p.y < pistonY + 12) {
            p.y = pistonY + 12;
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

      // Draw Piston Head
      ctx.fillStyle = pistonColor;
      ctx.fillRect(cylLeft + 3, pistonY - 8, cylWidth - 6, 16);
      ctx.strokeStyle = isLightTheme ? '#0369a1' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(cylLeft + 3, pistonY - 8, cylWidth - 6, 16);

      // Piston Rod (Shaft)
      const rodWidth = 14;
      const rodX = (cylLeft + cylRight) / 2 - rodWidth / 2;
      ctx.fillStyle = isLightTheme ? '#64748b' : '#94a3b8';
      ctx.fillRect(rodX, 10, rodWidth, pistonY - 10);
      ctx.strokeRect(rodX, 10, rodWidth, pistonY - 10);

      // Piston Weights / Load on top
      ctx.fillStyle = isLightTheme ? '#475569' : '#64748b';
      ctx.fillRect(rodX - 25, 6, rodWidth + 50, 10);
      ctx.strokeRect(rodX - 25, 6, rodWidth + 50, 10);

      // Boundary Label
      ctx.fillStyle = isLightTheme ? '#0369a1' : '#38bdf8';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Movable Boundary (P = ${pressureKPa} kPa)`, cylLeft + 10, pistonY - 14);

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [volume, temperature, moles, isDark, isPlaying, pressureKPa]);

  // Generate PV isotherm curve for Recharts
  const pvCurveData = useMemo(() => {
    const data = [];
    // Generate V from 0.02 to 0.10
    for (let v = 0.02; v <= 0.105; v += 0.005) {
      const p = (moles * R * temperature) / v / 1000;
      data.push({
        v: Math.round(v * 1000) / 1000,
        p: Math.round(p * 10) / 10,
      });
    }
    return data;
  }, [moles, temperature, R]);

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Piston-Cylinder Movable Boundary Simulator (<MathView math="PV = nRT" />)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Interactive displacement work <MathView math="W = \int P dV" /> with live-updating Ideal Gas <MathView math="P-V" /> diagram.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 text-white hover:bg-teal-500 transition-colors shadow-xs"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Motion' : 'Play Motion'}</span>
          </button>
          <button
            onClick={() => {
              setVolume(0.05);
              setTemperature(300);
              setMoles(2.0);
              setMode('free');
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Process Mode:</span>
        {[
          { id: 'free', label: 'Free State (PV=nRT)' },
          { id: 'isothermal', label: 'Isothermal (T = Const)' },
          { id: 'isobaric', label: 'Isobaric (P = Const)' },
          { id: 'isochoric', label: 'Isochoric (V = Const)' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as any)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              mode === m.id
                ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Visual Piston Chamber & PV Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Canvas Piston-Cylinder (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={320}
            height={280}
            className="w-full max-w-[320px] h-auto rounded-xl shadow-inner"
          />
          <div className="flex items-center justify-between w-full mt-3 px-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Rigid Bottom (<MathView math="W=0" />)</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">Movable Top (<MathView math="dV \ne 0" />)</span>
          </div>
        </div>

        {/* Right: Recharts Live P-V Diagram (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Live P-V Diagram (Isotherm @ {temperature} K)</span>
            </h4>
            <span className="text-[11px] font-mono text-cyan-700 dark:text-cyan-300 font-bold">
              State: ({volume.toFixed(3)} m³, {pressureKPa} kPa)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pvCurveData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="v"
                  type="number"
                  domain={[0.02, 0.10]}
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Volume V (m³)', position: 'insideBottomRight', offset: -5, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <YAxis
                  dataKey="p"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Pressure P (kPa)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700 font-mono shadow-lg">
                          <p>V: {payload[0].payload.v} m³</p>
                          <p className="text-teal-400 font-bold">P: {payload[0].payload.p} kPa</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="p" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#pvArea)" />
                <ReferenceDot
                  x={volume}
                  y={pressureKPa}
                  r={6}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth={2}
                  isFront
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sliders & Numerical Readouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        {/* Slider 1: Volume */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Volume (<MathView math="V" />)</span>
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
            disabled={mode === 'isochoric'}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600 disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>20 L (Compressed)</span>
            <span>100 L (Expanded)</span>
          </div>
        </div>

        {/* Slider 2: Temperature */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Temperature (<MathView math="T" />)</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              {temperature} K ({(temperature - 273.15).toFixed(1)} °C)
            </span>
          </div>
          <input
            type="range"
            min="200"
            max="800"
            step="10"
            value={temperature}
            disabled={mode === 'isothermal'}
            onChange={(e) => handleTempChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 disabled:opacity-40"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>200 K (-73°C)</span>
            <span>800 K (527°C)</span>
          </div>
        </div>

        {/* Slider 3: Moles */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Gas Amount (<MathView math="n" />)</span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {moles.toFixed(2)} moles
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.1"
            value={moles}
            onChange={(e) => handleMolesChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>0.5 mol</span>
            <span>4.0 mol</span>
          </div>
        </div>
      </div>

      {/* Thermodynamic State Readout Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Calculated Pressure</div>
          <div className="text-base font-bold font-mono text-teal-600 dark:text-teal-400">{pressureKPa} kPa</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{(pressureKPa / 100).toFixed(2)} bar</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Volume</div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white">{(volume * 1000).toFixed(1)} L</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{volume.toFixed(3)} m³</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Temperature</div>
          <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">{temperature} K</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{(temperature - 273.15).toFixed(1)} °C</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Ideal Gas Product</div>
          <div className="text-base font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {(moles * R * temperature / 1000).toFixed(2)} kJ
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="nRT" /> energy content</div>
        </div>
      </div>

      {/* Key Takeaway Box */}
      <div className="bg-sky-50/70 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-xl p-3.5">
        <h5 className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider mb-1.5">📝 Key Revision Takeaways</h5>
        <ul className="text-xs text-sky-900 dark:text-sky-300 space-y-1 leading-relaxed">
          <li>• <strong>Ideal Gas Law</strong>: PV = nRT — pressure, volume, and temperature are interconnected</li>
          <li>• Isothermal (T const): P ∝ 1/V hyperbola | Isobaric (P const): V ∝ T | Isochoric (V const): P ∝ T</li>
          <li>• Work W = ∫P dV — area under the P-V curve (path dependent, NOT a property)</li>
          <li>• Particle speed ∝ √T — higher temperature means faster molecular motion and higher pressure</li>
        </ul>
      </div>
    </div>
  );
};
