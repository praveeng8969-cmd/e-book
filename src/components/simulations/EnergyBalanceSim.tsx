import React, { useState, useMemo } from 'react';
import { Flame, Zap, Activity, RotateCcw, ArrowRight, ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, Cell } from 'recharts';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

export const EnergyBalanceSim: React.FC = () => {
  const { isDark } = useTheme();

  const [heatQ, setHeatQ] = useState<number>(250); // kJ (Heat Added Q)
  const [workW, setWorkW] = useState<number>(100); // kJ (Work Done W)
  const [preset, setPreset] = useState<string>('custom');

  // First Law Calculation: Delta U = Q - W
  const deltaU = useMemo(() => {
    return Math.round((heatQ - workW) * 10) / 10;
  }, [heatQ, workW]);

  // Handle Preset Selections
  const handlePreset = (type: string) => {
    setPreset(type);
    switch (type) {
      case 'isochoric':
        // Constant volume: W = 0 -> Delta U = Q
        setWorkW(0);
        setHeatQ(200);
        break;
      case 'adiabatic':
        // Q = 0 -> Delta U = -W
        setHeatQ(0);
        setWorkW(150);
        break;
      case 'isothermal':
        // Delta U = 0 -> Q = W
        setHeatQ(180);
        setWorkW(180);
        break;
      case 'isobaric':
        // Q = Delta H = Delta U + P*DeltaV
        setHeatQ(300);
        setWorkW(120);
        break;
      case 'compression':
        // Work on system W < 0, Heat out Q < 0
        setHeatQ(-100);
        setWorkW(-220);
        break;
      default:
        break;
    }
  };

  // Chart Data for Recharts
  const chartData = [
    {
      name: 'Heat Added (Q)',
      value: heatQ,
      color: heatQ >= 0 ? '#f43f5e' : '#0284c7',
      label: heatQ >= 0 ? 'Heat IN (+Q)' : 'Heat OUT (-Q)',
    },
    {
      name: 'Work Done (W)',
      value: workW,
      color: workW >= 0 ? '#10b981' : '#f59e0b',
      label: workW >= 0 ? 'Work OUT (+W)' : 'Work IN (-W)',
    },
    {
      name: 'Change in Internal Energy (ΔU)',
      value: deltaU,
      color: deltaU >= 0 ? '#8b5cf6' : '#ec4899',
      label: deltaU >= 0 ? 'ΔU > 0 (Heating)' : 'ΔU < 0 (Cooling)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              First Law Closed System Energy Balance (<MathView math="\Delta U = Q - W" />)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Conservation of Energy: Heat Added (<MathView math="Q" />), Boundary Work (<MathView math="W" />), and Internal Energy storage (<MathView math="\Delta U" />).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setHeatQ(250);
            setWorkW(100);
            setPreset('custom');
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Reset Inputs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Process Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">Process Preset:</span>
        {[
          { id: 'custom', label: 'Custom' },
          { id: 'isochoric', label: 'Isochoric (W = 0)' },
          { id: 'adiabatic', label: 'Adiabatic (Q = 0)' },
          { id: 'isothermal', label: 'Isothermal (ΔU = 0)' },
          { id: 'isobaric', label: 'Isobaric Expansion' },
          { id: 'compression', label: 'Work Compression' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => handlePreset(p.id)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              preset === p.id
                ? 'bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Visual Closed Chamber & Recharts Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Closed System Diagram (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <svg viewBox="0 0 320 250" className="w-full max-w-[320px] h-[250px]">
            {/* System Boundary Container */}
            <rect
              x="50"
              y="40"
              width="220"
              height="160"
              rx="16"
              fill={deltaU >= 0 ? (isDark ? '#2e1065' : '#ede9fe') : (isDark ? '#082f49' : '#e0f2fe')}
              stroke="#8b5cf6"
              strokeWidth="2.5"
              strokeDasharray="4 4"
            />

            {/* Internal State Text */}
            <text x="160" y="85" textAnchor="middle" fill={isDark ? '#e9d5ff' : '#6b21a8'} fontWeight="bold" fontSize="13">
              CONTROL MASS (CLOSED SYSTEM)
            </text>
            <text x="160" y="115" textAnchor="middle" fill={isDark ? '#ffffff' : '#0f172a'} fontWeight="bold" fontSize="20" fontFamily="monospace">
              ΔU = {deltaU > 0 ? `+${deltaU}` : deltaU} kJ
            </text>
            <text x="160" y="140" textAnchor="middle" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="11">
              {deltaU > 0 ? 'Temperature & Energy Rises (ΔT > 0)' : deltaU < 0 ? 'Temperature & Energy Drops (ΔT < 0)' : 'Internal Energy Constant (ΔU = 0)'}
            </text>

            {/* Heat Q Arrow (Left Boundary) */}
            <g transform="translate(10, 100)">
              {heatQ >= 0 ? (
                // Heat IN
                <g>
                  <path d="M 0 20 L 35 20 M 25 12 L 35 20 L 25 28" stroke="#f43f5e" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="10" cy="20" r="12" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1.5" />
                  <text x="10" y="24" textAnchor="middle" fill="#e11d48" fontSize="11" fontWeight="bold">Q</text>
                  <text x="5" y="-5" fill="#f43f5e" fontSize="10" fontWeight="bold">+{heatQ} kJ (IN)</text>
                </g>
              ) : (
                // Heat OUT
                <g>
                  <path d="M 35 20 L 0 20 M 10 12 L 0 20 L 10 28" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="25" cy="20" r="12" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="25" y="24" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="bold">Q</text>
                  <text x="5" y="-5" fill="#0284c7" fontSize="10" fontWeight="bold">{heatQ} kJ (OUT)</text>
                </g>
              )}
            </g>

            {/* Work W Arrow (Right Boundary) */}
            <g transform="translate(270, 100)">
              {workW >= 0 ? (
                // Work OUT
                <g>
                  <path d="M 0 20 L 35 20 M 25 12 L 35 20 L 25 28" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="10" cy="20" r="12" fill="#d1fae5" stroke="#10b981" strokeWidth="1.5" />
                  <text x="10" y="24" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="bold">W</text>
                  <text x="-25" y="-5" fill="#10b981" fontSize="10" fontWeight="bold">+{workW} kJ (OUT)</text>
                </g>
              ) : (
                // Work IN
                <g>
                  <path d="M 35 20 L 0 20 M 10 12 L 0 20 L 10 28" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <circle cx="25" cy="20" r="12" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="25" y="24" textAnchor="middle" fill="#b45309" fontSize="11" fontWeight="bold">W</text>
                  <text x="-25" y="-5" fill="#f59e0b" fontSize="10" fontWeight="bold">{workW} kJ (IN)</text>
                </g>
              )}
            </g>

            {/* Mass Flow Prohibition Badge */}
            <rect x="105" y="215" width="110" height="22" rx="6" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
            <text x="160" y="230" textAnchor="middle" fill="#475569" fontSize="10" fontWeight="bold">
              Mass Transfer Δm = 0
            </text>
          </svg>
        </div>

        {/* Right: Recharts Real-Time Energy Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Real-Time Energy Terms Comparison (kJ)</span>
            </h4>
            <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
              Q - W = {deltaU} kJ
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Energy (kJ)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg border border-slate-700 font-mono shadow-lg">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-teal-400">{data.value} kJ</p>
                          <p className="text-slate-400 text-[10px]">{data.label}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Inputs / Sliders for Q and W */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Heat Added Q Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-rose-500/20 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Heat Transfer (<MathView math="Q" />)
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              {heatQ > 0 ? `+${heatQ}` : heatQ} kJ
            </span>
          </div>
          <input
            type="range"
            min="-200"
            max="400"
            step="10"
            value={heatQ}
            onChange={(e) => {
              setHeatQ(parseFloat(e.target.value));
              setPreset('custom');
            }}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>-200 kJ (Heat Rejection)</span>
            <span>+400 kJ (Heat Addition)</span>
          </div>
        </div>

        {/* Work Done W Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-emerald-500/20 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Work Interaction (<MathView math="W" />)
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {workW > 0 ? `+${workW}` : workW} kJ
            </span>
          </div>
          <input
            type="range"
            min="-200"
            max="400"
            step="10"
            value={workW}
            onChange={(e) => {
              setWorkW(parseFloat(e.target.value));
              setPreset('custom');
            }}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>-200 kJ (Work On System)</span>
            <span>+400 kJ (Work By System)</span>
          </div>
        </div>
      </div>

      {/* Readout Matrix Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Change in Internal Energy</div>
          <div className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
            {deltaU > 0 ? `+${deltaU}` : deltaU} kJ
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="\Delta U = Q - W" /></div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Heat Input (<MathView math="Q" />)</div>
          <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">{heatQ} kJ</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{heatQ >= 0 ? 'Endothermic (+)' : 'Exothermic (-)'}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Work Output (<MathView math="W" />)</div>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">{workW} kJ</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{workW >= 0 ? 'Expansion (+)' : 'Compression (-)'}</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">System Status</div>
          <div className="text-xs font-bold text-teal-600 dark:text-teal-400">
            {deltaU > 0 ? 'Energy Accumulating' : deltaU < 0 ? 'Energy Depleting' : 'Energy Balanced'}
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">1st Law Satisfied</div>
        </div>
      </div>
    </div>
  );
};
