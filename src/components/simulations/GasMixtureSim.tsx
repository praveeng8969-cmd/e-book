import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layers, Play, RotateCcw, ArrowRightLeft, Sparkles, Scale, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from 'recharts';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);

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

      if (shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animId);
  }, [isMixed, gasA, gasB, molesA, molesB, shouldAnimate, isDark]);

  // Recharts Partial Pressures Bar Chart Data
  const chartData = [
    {
      name: `Partial pressure of ${gasA.formula}`,
      pressure: partialPA,
      fraction: (moleFractionA * 100).toFixed(1) + '%',
      color: gasA.color,
    },
    {
      name: `Partial pressure of ${gasB.formula}`,
      pressure: partialPB,
      fraction: (moleFractionB * 100).toFixed(1) + '%',
      color: gasB.color,
    },
    {
      name: 'Total pressure (Dalton)',
      pressure: totalPressureKPa,
      fraction: '100%',
      color: '#14b8a6', // Teal
    },
  ];

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="card-heading text-slate-900 dark:text-white">
              Dalton's Law of Partial Pressures Chamber Lab
            </h3>
            <p className="secondary-text text-slate-600 dark:text-slate-400">
              <MathView math="P_{total} = \sum P_i = P_A + P_B" /> with mole fractions <MathView math="y_i = n_i / n_{total}" /> and gas mixing kinetics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMixed(!isMixed)}
            className={`min-h-[44px] flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white transition-all shadow-xs ${
              isMixed
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-teal-600 hover:bg-teal-500 animate-pulse'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
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
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reset Chamber"
          >
            <RotateCcw className="w-5 h-5" />
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
            <span className="font-bold text-sm text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Gas Species A
            </span>
            <select
              value={gasAKey}
              onChange={(e) => setGasAKey(e.target.value)}
              className="min-h-[40px] text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {Object.keys(GAS_SPECIES).map((k) => (
                <option key={k} value={k}>
                  {GAS_SPECIES[k].formula} ({GAS_SPECIES[k].name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Moles of Gas A (<MathView math="n_A" />)</span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{molesA.toFixed(1)} mol</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={molesA}
              onChange={(e) => setMolesA(parseFloat(e.target.value))}
              className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-sky-500 touch-pan-y"
            />
            <div className="flex justify-between secondary-text text-slate-500 dark:text-slate-400 font-mono">
              <span>0.5 mol</span>
              <span>Mole Fraction <MathView math="y_A" /> = {(moleFractionA * 100).toFixed(1)}%</span>
              <span>6.0 mol</span>
            </div>
          </div>
        </div>

        {/* Gas B Controls */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Gas Species B
            </span>
            <select
              value={gasBKey}
              onChange={(e) => setGasBKey(e.target.value)}
              className="min-h-[40px] text-sm font-medium px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {Object.keys(GAS_SPECIES).map((k) => (
                <option key={k} value={k}>
                  {GAS_SPECIES[k].formula} ({GAS_SPECIES[k].name})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300 font-medium">Moles of Gas B (<MathView math="n_B" />)</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{molesB.toFixed(1)} mol</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="6.0"
              step="0.5"
              value={molesB}
              onChange={(e) => setMolesB(parseFloat(e.target.value))}
              className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-amber-500 touch-pan-y"
            />
            <div className="flex justify-between secondary-text text-slate-500 dark:text-slate-400 font-mono">
              <span>0.5 mol</span>
              <span>Mole Fraction <MathView math="y_B" /> = {(moleFractionB * 100).toFixed(1)}%</span>
              <span>6.0 mol</span>
            </div>
          </div>
        </div>
      </div>

      {/* Readout Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Total Pressure (<MathView math="P_{tot}" />)</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">{totalPressureKPa} kPa</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{(totalPressureKPa / 100).toFixed(2)} bar</div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Partial Pressure <MathView math="P_A" /></div>
          <div className="text-lg sm:text-xl font-bold font-mono text-sky-600 dark:text-sky-400 mt-1">{partialPA} kPa</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5"><MathView math="y_A" /> = {(moleFractionA * 100).toFixed(1)}%</div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Partial Pressure <MathView math="P_B" /></div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{partialPB} kPa</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5"><MathView math="y_B" /> = {(moleFractionB * 100).toFixed(1)}%</div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Mixture Molar Mass (<MathView math="M_e" />)</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">{mixMolarMass} g/mol</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5"><MathView math="R_{mix}" /> = {rMix} kJ/kg·K</div>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe="When two different gases occupy the same container, each gas exerts a partial pressure directly proportional to its mole fraction: P_i = y_i · P_total."
        reason="In an ideal gas mixture, molecules are point masses with negligible volume and zero intermolecular attraction. Thus, each gas species behaves as if it alone occupied the entire chamber at the mixture temperature (Dalton's Law of Additive Pressures)."
        takeaway="Dalton's Law: $P = \sum P_i = \sum y_i P$. Amagat's Law: $V = \sum V_i = \sum y_i V$. Apparent molar mass: $M_{\text{mix}} = \sum y_i M_i$, and specific gas constant $R_{\text{mix}} = \frac{R_u}{M_{\text{mix}}}$."
        governingEquation="P_i = y_i P \quad \text{where} \quad y_i = \frac{n_i}{\sum n_k} \quad \text{and} \quad \sum y_i = 1"
        stateValues={[
          { label: 'P_total', value: `${totalPressureKPa.toFixed(1)}`, unit: 'kPa' },
          { label: 'M_mix', value: `${mixMolarMass.toFixed(2)}`, unit: 'g/mol', highlight: true },
          { label: 'R_mix', value: `${rMix.toFixed(4)}`, unit: 'kJ/kg·K' },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Dalton's & Amagat's Laws of Ideal Gas Mixtures"
        badge="GAS MIXTURES REVISION"
        explanation="The thermodynamic behavior of a non-reacting mixture of ideal gases is governed by the additive partial properties of its constituents evaluated at the mixture temperature and volume (Dalton) or mixture temperature and pressure (Amagat)."
        equation="P_{\text{total}} = \sum_{i=1}^{k} P_i = \sum_{i=1}^{k} y_i P_{\text{total}} \quad \text{and} \quad V_{\text{total}} = \sum_{i=1}^{k} V_i = \sum_{i=1}^{k} y_i V_{\text{total}}"
        secondaryEquation="M_{\text{mix}} = \sum_{i=1}^{k} y_i M_i = \frac{1}{\sum (m_{fi} / M_i)} \quad \text{and} \quad R_{\text{mix}} = \frac{R_u}{M_{\text{mix}}}"
        specialCases={[
          {
            label: '1. Dalton’s Law (Additive Pressures)',
            condition: 'P_i = \frac{n_i R_u T}{V_{\text{mix}}}',
            result: 'The total pressure exerted by a gas mixture equals the sum of the partial pressures each constituent would exert if it alone occupied the entire volume at mixture temperature.',
          },
          {
            label: '2. Amagat’s Law (Additive Volumes)',
            condition: 'V_i = \frac{n_i R_u T}{P_{\text{mix}}}',
            result: 'The total volume of a gas mixture equals the sum of the partial volumes each constituent would occupy if it existed alone at the mixture pressure and temperature.',
          },
          {
            label: '3. Mass vs Mole Fraction Interconversion',
            condition: 'm_{fi} = y_i \left(\frac{M_i}{M_{\text{mix}}}\right)',
            result: 'Mole fraction: $y_i = \\frac{m_{fi} / M_i}{\\sum (m_{fk} / M_k)}$. Note that $\\sum y_i = 1$ and $\\sum m_{fi} = 1$ always.',
          },
        ]}
        symbols={[
          { symbol: 'y_i', name: 'Mole Fraction of Species i', unit: 'Dimensionless [-]', description: 'Ratio of moles of species i to total moles: n_i / n_total' },
          { symbol: 'm_{fi}', name: 'Mass Fraction of Species i', unit: 'Dimensionless [-]', description: 'Ratio of mass of species i to total mass: m_i / m_total' },
          { symbol: 'P_i', name: 'Partial Pressure', unit: 'kPa or bar', description: 'Pressure contributed by component species i: y_i P_total' },
          { symbol: 'M_{\\text{mix}}', name: 'Apparent / Mean Molar Mass', unit: 'g/mol or kg/kmol', description: 'Weighted molar mass of the mixture: ∑ y_i M_i' },
          { symbol: 'R_{\\text{mix}}', name: 'Mixture Gas Constant', unit: 'kJ/(kg·K)', description: 'Universal gas constant divided by mean molar mass: Ru / M_mix' },
        ]}
        takeaway="For any ideal gas mixture, the partial pressure fraction equals the partial volume fraction, which identically equals the mole fraction: $\frac{P_i}{P} = \frac{V_i}{V} = \frac{n_i}{n} = y_i$."
        validity="Valid for mixtures of non-reacting gases at low to moderate pressures where each constituent obeys the ideal gas equation of state ($P v = R T$)."
        variant="indigo"
      />
    </div>
  );
};
