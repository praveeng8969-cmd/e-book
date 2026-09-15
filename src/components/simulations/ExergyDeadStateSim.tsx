import React, { useState, useMemo } from 'react';
import { BatteryCharging, Flame, Wind, RotateCcw, Activity, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

export const ExergyDeadStateSim: React.FC = () => {
  const { isDark } = useTheme();

  const [tempSource, setTempSource] = useState<number>(800); // K (System/Source Temperature T)
  const [tempDeadState, setTempDeadState] = useState<number>(298.15); // K (Dead State Environment T0)
  const [totalHeatQ, setTotalHeatQ] = useState<number>(1000); // kJ (Total Energy Q)

  // Carnot Maximum Conversion Factor: eta = 1 - T0 / T (if T >= T0)
  const carnotFactor = useMemo(() => {
    if (tempSource <= tempDeadState) return 0;
    return 1 - tempDeadState / tempSource;
  }, [tempSource, tempDeadState]);

  // Exergy (Available Energy AE / Maximum Work W_max)
  const exergyKJ = useMemo(() => {
    return Math.round(totalHeatQ * carnotFactor * 10) / 10;
  }, [totalHeatQ, carnotFactor]);

  // Anergy (Unavailable Energy UE / Heat rejected to dead state T0)
  const anergyKJ = useMemo(() => {
    return Math.round((totalHeatQ - exergyKJ) * 10) / 10;
  }, [totalHeatQ, exergyKJ]);

  // Exergy and Anergy percentages
  const exergyPercent = Math.round((exergyKJ / totalHeatQ) * 1000) / 10;
  const anergyPercent = Math.round((anergyKJ / totalHeatQ) * 1000) / 10;

  // Recharts Pie Data
  const pieData = [
    {
      name: 'Exergy (Available Work W_max)',
      value: exergyKJ,
      color: '#10b981', // Emerald
    },
    {
      name: 'Anergy (Unavailable Energy Q_0)',
      value: anergyKJ,
      color: isDark ? '#475569' : '#94a3b8', // Slate
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Exergy & Dead State (<MathView math="T_0" />) Visualizer: Available vs Unavailable Energy
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Total Energy split: Energy (Q) = Exergy (Available Work) + Anergy (Unavailable Energy).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTempSource(800);
            setTempDeadState(298.15);
            setTotalHeatQ(1000);
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Reset Inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid: Visual Sankey Energy Split & Recharts Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Sankey Energy Stream (6 cols) */}
        <div className="lg:col-span-6 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <svg viewBox="0 0 380 250" className="w-full max-w-[380px] h-[250px]">
            {/* Input Thermal Energy Stream (Left) */}
            <path
              d="M 20 80 L 120 80 L 120 170 L 20 170 Z"
              fill={isDark ? '#e11d48' : '#fda4af'}
              stroke="#e11d48"
              strokeWidth="2"
            />
            <text x="70" y="120" textAnchor="middle" fill="#9f1239" fontWeight="bold" fontSize="12">
              TOTAL ENERGY (Q)
            </text>
            <text x="70" y="140" textAnchor="middle" fill="#9f1239" fontWeight="bold" fontSize="14" fontFamily="monospace">
              {totalHeatQ} kJ
            </text>

            {/* Split Junction */}
            {/* Upper Stream: Exergy (Available Work) */}
            <path
              d="M 120 80 C 180 80, 200 40, 260 40 L 360 40 L 360 95 L 260 95 C 200 95, 180 125, 120 125 Z"
              fill="#10b981"
              stroke="#047857"
              strokeWidth="2"
            />
            <text x="310" y="62" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="11">
              EXERGY (AE)
            </text>
            <text x="310" y="80" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13" fontFamily="monospace">
              {exergyKJ} kJ ({exergyPercent}%)
            </text>

            {/* Lower Stream: Anergy (Unavailable Energy) */}
            <path
              d="M 120 125 C 180 125, 200 155, 260 155 L 360 155 L 360 210 L 260 210 C 200 210, 180 170, 120 170 Z"
              fill={isDark ? '#475569' : '#94a3b8'}
              stroke={isDark ? '#64748b' : '#64748b'}
              strokeWidth="2"
            />
            <text x="310" y="177" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="11">
              ANERGY (UE)
            </text>
            <text x="310" y="195" textAnchor="middle" fill="#ffffff" fontWeight="bold" fontSize="13" fontFamily="monospace">
              {anergyKJ} kJ ({anergyPercent}%)
            </text>

            {/* Ambient Reservoir Tag */}
            <text x="310" y="232" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">
              Sink @ Dead State (T₀ = {tempDeadState} K)
            </text>
          </svg>
        </div>

        {/* Right: Recharts Donut Pie Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Available vs Unavailable Work Split</span>
            </h4>
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Carnot <MathView math="\eta_{max}" /> = {(carnotFactor * 100).toFixed(1)}%
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg border border-slate-700 font-mono shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-emerald-400">{data.value} kJ</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sliders for System Temp, Dead State Temp, and Heat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* System Source Temperature */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-rose-500/20 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Source Temperature (<MathView math="T" />)
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{tempSource} K</span>
          </div>
          <input
            type="range"
            min="300"
            max="1500"
            step="20"
            value={tempSource}
            onChange={(e) => setTempSource(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>300 K (27°C)</span>
            <span>1500 K (1227°C)</span>
          </div>
        </div>

        {/* Dead State Temperature */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-teal-500/20 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" /> Dead State Ambient (<MathView math="T_0" />)
            </span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{tempDeadState} K</span>
          </div>
          <input
            type="range"
            min="250"
            max="350"
            step="1"
            value={tempDeadState}
            onChange={(e) => setTempDeadState(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>250 K (Sub-zero)</span>
            <span>350 K (Hot climate)</span>
          </div>
        </div>

        {/* Heat Quantity Q */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-amber-500/20 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Heat Input (<MathView math="Q" />)
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{totalHeatQ} kJ</span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={totalHeatQ}
            onChange={(e) => setTotalHeatQ(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>100 kJ</span>
            <span>2000 kJ</span>
          </div>
        </div>
      </div>

      {/* Numerical Exergy & Anergy Readout Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Exergy (Available Work)</div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {exergyKJ} kJ
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="X = Q(1 - T_0/T)" /> ({exergyPercent}%)</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Anergy (Unavailable Energy)</div>
          <div className="text-base font-bold font-mono text-slate-600 dark:text-slate-400">
            {anergyKJ} kJ
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="UE = Q(T_0/T)" /> ({anergyPercent}%)</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Quality of Energy</div>
          <div className="text-base font-bold font-mono text-teal-600 dark:text-teal-400">
            {(carnotFactor * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">Max work potential</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Dead State Status</div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {tempSource === tempDeadState ? 'At Dead State (X = 0)' : 'Non-Equilibrium (X > 0)'}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="T_0" /> = {tempDeadState} K</div>
        </div>
      </div>

      {/* Key Takeaway Box */}
      <div className="bg-amber-50/70 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
          <span>⚡</span> Quick Revision — Exergy & Availability
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Dead State (<MathView math="T_0, P_0" />):</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">When system reaches complete thermodynamic equilibrium with surroundings, Exergy = 0. No work can be extracted.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Heat Transfer Exergy:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              <MathView math="X_Q = Q(1 - T_0/T) = W_{max}" />. Anergy <MathView math="UAE = Q - X_Q = T_0 \Delta S" />.
            </div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-amber-100 dark:border-amber-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Gouy-Stodola Theorem:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              Exergy destruction <MathView math="I = T_0 S_{gen} \ge 0" />. Exergy is always consumed in real irreversible processes.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
