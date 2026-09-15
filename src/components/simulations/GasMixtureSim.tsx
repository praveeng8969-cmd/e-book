import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layers, Play, RotateCcw, ArrowRightLeft, Sparkles, Scale, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from 'recharts';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

interface GasSpecies {
  name: string;
  formula: string;
  molarMass: number; // g/mol
  color: string;
  particleColor: string;
}

const GAS_SPECIES: Record<string, GasSpecies> = {
  N2: { name: 'Nitrogen', formula: 'N₂', molarMass: 28.013, color: '#0284c7', particleColor: '#38bdf8' },
  O2: { name: 'Oxygen', formula: 'O₂', molarMass: 31.999, color: '#059669', particleColor: '#34d399' },
  CO2: { name: 'Carbon Dioxide', formula: 'CO₂', molarMass: 44.01, color: '#d97706', particleColor: '#fbbf24' },
  He: { name: 'Helium', formula: 'He', molarMass: 4.003, color: '#7c3aed', particleColor: '#a78bfa' },
  Ar: { name: 'Argon', formula: 'Ar', molarMass: 39.948, color: '#e11d48', particleColor: '#f43f5e' },
};

export const GasMixtureSim: React.FC = () => {
  const { isDark } = useTheme();

  const [gasAKey, setGasAKey] = useState<string>('N2');
  const [molesA, setMolesA] = useState<number>(3.0); // moles
  const [gasBKey, setGasBKey] = useState<string>('CO2');
  const [molesB, setMolesB] = useState<number>(2.0); // moles

  const [isMixed, setIsMixed] = useState<boolean>(false);
  const [temperatureK, setTemperatureK] = useState<number>(300); // K (27°C)
  const [chamberVolumeL, setChamberVolumeL] = useState<number>(50); // Total Liters (V = 0.05 m^3)

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const gasA = GAS_SPECIES[gasAKey];
  const gasB = GAS_SPECIES[gasBKey];

  // Universal Gas Constant R = 8.314 J/(mol·K)
  const R = 8.314;
  const totalVolumeM3 = chamberVolumeL / 1000;

  // Dalton's Law Calculations
  const totalMoles = molesA + molesB;
  const moleFractionA = molesA / totalMoles;
  const moleFractionB = molesB / totalMoles;

  // Total Pressure P_tot = (n_tot * R * T) / V (in kPa)
  const totalPressureKPa = useMemo(() => {
    const pPa = (totalMoles * R * temperatureK) / totalVolumeM3;
    return Math.round((pPa / 1000) * 10) / 10;
  }, [totalMoles, temperatureK, totalVolumeM3, R]);

  // Partial Pressures P_A = y_A * P_tot, P_B = y_B * P_tot
  const partialPA = useMemo(() => {
    return Math.round(moleFractionA * totalPressureKPa * 10) / 10;
  }, [moleFractionA, totalPressureKPa]);

  const partialPB = useMemo(() => {
    return Math.round(moleFractionB * totalPressureKPa * 10) / 10;
  }, [moleFractionB, totalPressureKPa]);

  // Apparent Molecular Weight: M_mix = y_A * M_A + y_B * M_B
  const mixMolarMass = useMemo(() => {
    return Math.round((moleFractionA * gasA.molarMass + moleFractionB * gasB.molarMass) * 100) / 100;
  }, [moleFractionA, moleFractionB, gasA, gasB]);

  // Specific Gas Constant R_mix = R_univ / M_mix (kJ/kg·K)
  const rMix = useMemo(() => {
    return Math.round((8.314 / mixMolarMass) * 1000) / 1000;
  }, [mixMolarMass]);

  // Particles ref for canvas animation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; type: 'A' | 'B' }>>([]);

  useEffect(() => {
    const pts = [];
    const countA = Math.min(45, Math.round(molesA * 10));
    const countB = Math.min(45, Math.round(molesB * 10));

    // Gas A (Left chamber)
    for (let i = 0; i < countA; i++) {
      pts.push({
        x: 40 + Math.random() * 120,
        y: 40 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        type: 'A' as const,
      });
    }

    // Gas B (Right chamber)
    for (let i = 0; i < countB; i++) {
      pts.push({
        x: 200 + Math.random() * 120,
        y: 40 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2.5,
        type: 'B' as const,
      });
    }

    particlesRef.current = pts;
  }, [molesA, molesB, gasAKey, gasBKey]);

  // Animation ticker
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

      // Background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Chamber Container: Left=30, Right=width-30, Top=30, Bottom=height-30
      const cLeft = 30;
      const cRight = width - 30;
      const cTop = 30;
      const cBottom = height - 35;
      const cMid = (cLeft + cRight) / 2;

      // Chamber Boundary Box
      ctx.strokeStyle = isLightTheme ? '#334155' : '#94a3b8';
      ctx.lineWidth = 3;
      ctx.strokeRect(cLeft, cTop, cRight - cLeft, cBottom - cTop);

      // Draw Partition Wall (if NOT mixed)
      if (!isMixed) {
        ctx.fillStyle = isLightTheme ? '#475569' : '#64748b';
        ctx.fillRect(cMid - 4, cTop, 8, cBottom - cTop);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(cMid - 4, cTop, 8, cBottom - cTop);

        // Partition Label
        ctx.fillStyle = isLightTheme ? '#b91c1c' : '#f87171';
        ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
        ctx.fillText('PARTITION', cMid - 24, cTop - 8);
      } else {
        // Open dashed guide
        ctx.strokeStyle = isLightTheme ? '#cbd5e1' : '#334155';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cMid, cTop);
        ctx.lineTo(cMid, cBottom);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Render Particles
      const pts = particlesRef.current;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;

        // Bounding box limits
        const minX = cLeft + 6;
        const maxX = cRight - 6;
        const minY = cTop + 6;
        const maxY = cBottom - 6;

        if (p.y < minY) {
          p.y = minY;
          p.vy = Math.abs(p.vy);
        } else if (p.y > maxY) {
          p.y = maxY;
          p.vy = -Math.abs(p.vy);
        }

        if (!isMixed) {
          // Confined to left or right chamber
          if (p.type === 'A') {
            if (p.x < minX) {
              p.x = minX;
              p.vx = Math.abs(p.vx);
            } else if (p.x > cMid - 8) {
              p.x = cMid - 8;
              p.vx = -Math.abs(p.vx);
            }
          } else {
            if (p.x < cMid + 8) {
              p.x = cMid + 8;
              p.vx = Math.abs(p.vx);
            } else if (p.x > maxX) {
              p.x = maxX;
              p.vx = -Math.abs(p.vx);
            }
          }
        } else {
          // Free diffusion across entire chamber
          if (p.x < minX) {
            p.x = minX;
            p.vx = Math.abs(p.vx);
          } else if (p.x > maxX) {
            p.x = maxX;
            p.vx = -Math.abs(p.vx);
          }
        }

        // Draw particle
        ctx.fillStyle = p.type === 'A' ? gasA.particleColor : gasB.particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.type === 'A' ? 4 : 4.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Labels on chambers
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = gasA.color;
      ctx.fillText(`Gas A: ${gasA.formula} (${molesA} mol)`, cLeft + 15, cTop + 20);

      ctx.fillStyle = gasB.color;
      ctx.fillText(`Gas B: ${gasB.formula} (${molesB} mol)`, cMid + 20, cTop + 20);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isMixed, gasA, gasB, molesA, molesB, isDark]);

  // Recharts Partial Pressures Bar Chart Data
  const chartData = [
    {
      name: `Partial P_A (${gasA.formula})`,
      pressure: partialPA,
      fraction: (moleFractionA * 100).toFixed(1) + '%',
      color: gasA.color,
    },
    {
      name: `Partial P_B (${gasB.formula})`,
      pressure: partialPB,
      fraction: (moleFractionB * 100).toFixed(1) + '%',
      color: gasB.color,
    },
    {
      name: 'Total P_tot (Dalton)',
      pressure: totalPressureKPa,
      fraction: '100%',
      color: '#14b8a6', // Teal
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Dalton's Law of Partial Pressures Chamber Lab
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <MathView math="P_{total} = \sum P_i = P_A + P_B" /> with mole fractions <MathView math="y_i = n_i / n_{total}" /> and gas mixing kinetics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMixed(!isMixed)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
              isMixed
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-teal-600 hover:bg-teal-500 animate-pulse'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{isMixed ? 'Reset / Separate Partition' : 'Remove Partition & Mix Gases'}</span>
          </button>
          <button
            onClick={() => {
              setIsMixed(false);
              setMolesA(3.0);
              setMolesB(2.0);
              setGasAKey('N2');
              setGasBKey('CO2');
              setTemperatureK(300);
            }}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reset Chamber"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Chamber & Partial Pressure Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Canvas Chamber (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={340}
            height={250}
            className="w-full max-w-[340px] h-auto rounded-xl shadow-inner"
          />
          <div className="flex items-center justify-between w-full mt-2 px-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Vol: {chamberVolumeL} L</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">
              {isMixed ? '✓ Homogeneous Mixture' : 'Separated Compartments'}
            </span>
            <span>T = {temperatureK} K</span>
          </div>
        </div>

        {/* Right: Recharts Partial Pressure Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Dalton Partial Pressures Split (kPa)</span>
            </h4>
            <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400">
              <MathView math="P_{tot}" /> = {totalPressureKPa} kPa ({(totalPressureKPa / 100).toFixed(2)} bar)
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Pressure (kPa)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg border border-slate-700 font-mono shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-teal-400">{data.pressure} kPa</p>
                          <p className="text-slate-400 text-[10px]">Mole Fraction: {data.fraction}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pressure" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Species Selectors & Mole Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gas A Controls */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-sky-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Gas Species A
            </span>
            <select
              value={gasAKey}
              onChange={(e) => setGasAKey(e.target.value)}
              className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {Object.keys(GAS_SPECIES).map((k) => (
                <option key={k} value={k}>
                  {GAS_SPECIES[k].formula} ({GAS_SPECIES[k].name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Moles of Gas A (<MathView math="n_A" />)</span>
              <span className="font-mono font-bold text-sky-600">{molesA.toFixed(1)} mol</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={molesA}
              onChange={(e) => setMolesA(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              <span>0.5 mol</span>
              <span>Mole Fraction <MathView math="y_A" /> = {(moleFractionA * 100).toFixed(1)}%</span>
              <span>6.0 mol</span>
            </div>
          </div>
        </div>

        {/* Gas B Controls */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Gas Species B
            </span>
            <select
              value={gasBKey}
              onChange={(e) => setGasBKey(e.target.value)}
              className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {Object.keys(GAS_SPECIES).map((k) => (
                <option key={k} value={k}>
                  {GAS_SPECIES[k].formula} ({GAS_SPECIES[k].name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Moles of Gas B (<MathView math="n_B" />)</span>
              <span className="font-mono font-bold text-amber-600">{molesB.toFixed(1)} mol</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={molesB}
              onChange={(e) => setMolesB(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
              <span>0.5 mol</span>
              <span>Mole Fraction <MathView math="y_B" /> = {(moleFractionB * 100).toFixed(1)}%</span>
              <span>6.0 mol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Readout Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Total Pressure (<MathView math="P_{tot}" />)</div>
          <div className="text-base font-bold font-mono text-teal-600 dark:text-teal-400">{totalPressureKPa} kPa</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{(totalPressureKPa / 100).toFixed(2)} bar</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Partial Pressure <MathView math="P_A" /></div>
          <div className="text-base font-bold font-mono text-sky-600 dark:text-sky-400">{partialPA} kPa</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="y_A" /> = {(moleFractionA * 100).toFixed(1)}%</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Partial Pressure <MathView math="P_B" /></div>
          <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">{partialPB} kPa</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="y_B" /> = {(moleFractionB * 100).toFixed(1)}%</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Mixture Molar Mass (<MathView math="M_e" />)</div>
          <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">{mixMolarMass} g/mol</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="R_{mix}" /> = {rMix} kJ/kg·K</div>
        </div>
      </div>

      {/* Key Takeaway Box */}
      <div className="bg-indigo-50/70 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
          <span>⚡</span> Quick Revision — Ideal Gas Mixture Laws & Formulas
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Dalton's & Amagat's Laws:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">P = &Sigma; P_i = &Sigma; y_i P (Additive pressures); V = &Sigma; V_i = &Sigma; y_i V (Additive volumes). y_i = n_i / n_mix.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Equivalent Molecular Weight:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">M_mix = &Sigma; y_i M_i = 1 / [&Sigma; (m_i / M_i)]. Gas constant R_mix = R_u / M_mix = &Sigma; m_i R_i.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Mass vs Mole Fraction:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">m_fi = y_i (M_i / M_mix), while y_i = (m_fi / M_i) / [&Sigma; (m_fk / M_k)]. Sum of all fractions = 1.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
