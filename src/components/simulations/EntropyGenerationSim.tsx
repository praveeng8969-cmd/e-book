import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Network, Zap, Flame, Snowflake, ArrowRight, Activity, RotateCcw, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot, AreaChart, Area } from 'recharts';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export const EntropyGenerationSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);
  const [tempSource, setTempSource] = useState<number>(600); // K (High Temp T_H)
  const [tempSink, setTempSink] = useState<number>(300); // K (Low Temp T_L)
  const [heatAmount, setHeatAmount] = useState<number>(1200); // kJ (Q)
  const [deadStateTemp, setDeadStateTemp] = useState<number>(298.15); // K (T0)
  const [isConducting, setIsConducting] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Thermodynamic calculations
  // Delta S_source = -Q / T_H
  // Delta S_sink = +Q / T_L
  // S_gen = Delta S_univ = (Delta S_source + Delta S_sink) = Q*(1/T_L - 1/T_H) >= 0
  const deltaS_source = -heatAmount / tempSource; // kJ/K
  const deltaS_sink = heatAmount / tempSink; // kJ/K
  const entropyGenerated = deltaS_source + deltaS_sink; // S_gen in kJ/K
  const deltaT = tempSource - tempSink;

  // Gouy-Stodola Exergy Destruction (Irreversibility): I = T0 * S_gen
  const exergyDestroyed = deadStateTemp * entropyGenerated; // kJ

  // Available Energy (AE) at T_H: AE1 = Q * (1 - T0/T_H)
  const ae_initial = heatAmount * (1 - deadStateTemp / tempSource);
  // Available Energy (AE) at T_L: AE2 = Q * (1 - T0/T_L)
  const ae_final = heatAmount * (1 - deadStateTemp / tempSink);
  const lossInAE = ae_initial - ae_final;

  // Animation of thermal energy packets
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const ct = getCanvasTheme();

      // Background
      ctx.fillStyle = ct.bg;
      ctx.fillRect(0, 0, width, height);

      // Block 1: Hot Thermal Reservoir (Left)
      const b1X = 35;
      const b1Y = 40;
      const bW = 120;
      const bH = 170;

      ctx.fillStyle = ct.isLight ? '#ffe4e6' : '#881337';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.fillRect(b1X, b1Y, bW, bH);
      ctx.strokeRect(b1X, b1Y, bW, bH);

      ctx.fillStyle = ct.isLight ? '#9f1239' : '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.fillText('HOT SOURCE', b1X + 18, b1Y + 28);
      ctx.font = 'bold 16px Fira Code, monospace';
      ctx.fillStyle = ct.isLight ? '#be123c' : '#fca5a5';
      ctx.fillText(`Tₕ = ${tempSource} K`, b1X + 12, b1Y + 65);
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = ct.isLight ? '#9f1239' : '#fecdd3';
      ctx.fillText(`ΔSₕ = ${(deltaS_source).toFixed(3)}`, b1X + 12, b1Y + 110);
      ctx.fillText('kJ/K (Entropy Lost)', b1X + 12, b1Y + 125);

      // Block 2: Cold Thermal Reservoir (Right)
      const b2X = width - 155;
      const b2Y = 40;

      ctx.fillStyle = ct.isLight ? '#e0f2fe' : '#0c4a6e';
      ctx.strokeStyle = ct.isLight ? '#0284c7' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.fillRect(b2X, b2Y, bW, bH);
      ctx.strokeRect(b2X, b2Y, bW, bH);

      ctx.fillStyle = ct.isLight ? '#0369a1' : '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.fillText('COLD SINK', b2X + 22, b2Y + 28);
      ctx.font = 'bold 16px Fira Code, monospace';
      ctx.fillStyle = ct.isLight ? '#0284c7' : '#7dd3fc';
      ctx.fillText(`Tₗ = ${tempSink} K`, b2X + 12, b2Y + 65);
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = ct.isLight ? '#0369a1' : '#bae6fd';
      ctx.fillText(`ΔSₗ = +${deltaS_sink.toFixed(3)}`, b2X + 12, b2Y + 110);
      ctx.fillText('kJ/K (Entropy Gained)', b2X + 12, b2Y + 125);

      // Conduction Bridge between reservoirs
      const bridgeX = b1X + bW;
      const bridgeY = b1Y + 40;
      const bridgeW = b2X - bridgeX;
      const bridgeH = 80;

      // Gradient thermal bridge
      const grad = ctx.createLinearGradient(bridgeX, 0, bridgeX + bridgeW, 0);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, ct.isLight ? '#0284c7' : '#38bdf8');
      ctx.fillStyle = grad;
      ctx.fillRect(bridgeX, bridgeY, bridgeW, bridgeH);
      ctx.strokeStyle = ct.isLight ? '#cbd5e1' : '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bridgeX, bridgeY, bridgeW, bridgeH);

      // Heat flow particle stream
      if (isConducting) {
        offset = (offset + 1.2) % 25;
        ctx.fillStyle = '#ffffff';
        for (let x = bridgeX + offset; x < bridgeX + bridgeW; x += 25) {
          ctx.beginPath();
          ctx.arc(x, bridgeY + bridgeH / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Q = ${heatAmount} kJ`, bridgeX + bridgeW / 2 - 35, bridgeY + 30);
      ctx.font = '9px Fira Code, monospace';
      ctx.fillText(`ΔT = ${deltaT} K`, bridgeX + bridgeW / 2 - 25, bridgeY + 55);

      // Bottom Banner: S_gen readout
      const bannerY = height - 30;
      ctx.fillStyle = entropyGenerated > 0.001 ? (ct.isLight ? '#fef3c7' : '#78350f') : (ct.isLight ? '#dcfce7' : '#14532d');
      ctx.fillRect(35, bannerY - 10, width - 70, 24);
      ctx.strokeStyle = entropyGenerated > 0.001 ? '#d97706' : '#16a34a';
      ctx.lineWidth = 1;
      ctx.strokeRect(35, bannerY - 10, width - 70, 24);

      ctx.fillStyle = entropyGenerated > 0.001 ? (ct.isLight ? '#92400e' : '#fef3c7') : (ct.isLight ? '#166534' : '#dcfce7');
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        `Universe Entropy: ΔS_univ = S_gen = ${entropyGenerated.toFixed(4)} kJ/K ≥ 0 (Irreversible Process)`,
        45,
        bannerY + 6
      );

      if (isConducting && shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animId);
  }, [tempSource, tempSink, heatAmount, deadStateTemp, isConducting, shouldAnimate, isDark, deltaS_source, deltaS_sink, entropyGenerated, deltaT]);

  // Recharts data curve showing S_gen vs Delta T (from Delta T = 0 to 600K with fixed T_L)
  const sGenCurveData = useMemo(() => {
    const data = [];
    for (let dt = 0; dt <= 600; dt += 25) {
      const th = tempSink + dt;
      const sgen = dt === 0 ? 0 : heatAmount * (1 / tempSink - 1 / th);
      data.push({
        deltaT: dt,
        sGen: Math.round(sgen * 1000) / 1000,
      });
    }
    return data;
  }, [heatAmount, tempSink]);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="card-heading text-slate-900 dark:text-white">
              Entropy Generation (<MathView math="\Delta S_{univ} = S_{gen}" />) & Irreversibility Lab
            </h3>
            <p className="secondary-text text-slate-600 dark:text-slate-400">
              Spontaneous heat transfer across a finite temperature difference <MathView math="\Delta T" /> generating entropy (<MathView math="S_{gen} > 0" />).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setTempSource(600);
            setTempSink(300);
            setHeatAmount(1200);
            setDeadStateTemp(298.15);
          }}
          className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Reset Simulation"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Main Grid: Animated Conduction Chambers & S_gen vs Delta T Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Canvas Thermal Conduction (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={340}
            height={250}
            className="w-full max-w-[340px] h-auto rounded-xl shadow-inner"
          />
        </div>

        {/* Right: Recharts S_gen vs Delta T Curve (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Entropy Generated <MathView math="S_{gen}" /> vs Temperature Difference <MathView math="\Delta T" /></span>
            </h4>
            <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
              <MathView math="\Delta T" /> = {deltaT} K → <MathView math="S_{gen}" /> = {entropyGenerated.toFixed(4)} kJ/K
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sGenCurveData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sGenArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="deltaT"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Temperature Difference ΔT (K)', position: 'insideBottomRight', offset: -5, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <YAxis
                  dataKey="sGen"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Entropy generated (kJ/K)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700 font-mono shadow-lg">
                          <p>ΔT: {payload[0].payload.deltaT} K</p>
                          <p className="text-amber-400 font-bold">S_gen: {payload[0].payload.sGen} kJ/K</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="sGen" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#sGenArea)" />
                <ReferenceDot
                  x={deltaT}
                  y={Math.round(entropyGenerated * 1000) / 1000}
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

      {/* Sliders for T_H, T_L, Q */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Hot Reservoir Temp */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-rose-500/20 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> Source Temp (<MathView math="T_H" />)
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{tempSource} K</span>
          </div>
          <input
            type="range"
            min={tempSink + 5}
            max="1200"
            step="10"
            value={tempSource}
            onChange={(e) => setTempSource(parseFloat(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-rose-500 touch-pan-y"
          />
          <div className="flex justify-between secondary-text text-slate-500 dark:text-slate-400 font-mono">
            <span>{tempSink + 5} K</span>
            <span>1200 K (927°C)</span>
          </div>
        </div>

        {/* Cold Reservoir Temp */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-cyan-500/20 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Snowflake className="w-4 h-4" /> Sink Temp (<MathView math="T_L" />)
            </span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{tempSink} K</span>
          </div>
          <input
            type="range"
            min="100"
            max={tempSource - 5}
            step="10"
            value={tempSink}
            onChange={(e) => setTempSink(parseFloat(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-cyan-500 touch-pan-y"
          />
          <div className="flex justify-between secondary-text text-slate-500 dark:text-slate-400 font-mono">
            <span>100 K (-173°C)</span>
            <span>{tempSource - 5} K</span>
          </div>
        </div>

        {/* Heat Quantity Q */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-amber-500/20 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Heat Flow (<MathView math="Q" />)
            </span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{heatAmount} kJ</span>
          </div>
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={heatAmount}
            onChange={(e) => setHeatAmount(parseFloat(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-amber-500 touch-pan-y"
          />
          <div className="flex justify-between secondary-text text-slate-500 dark:text-slate-400 font-mono">
            <span>200 kJ</span>
            <span>3000 kJ</span>
          </div>
        </div>
      </div>

      {/* Numerical Exergy & Entropy Readout Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Universe Entropy Gen</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
            {entropyGenerated.toFixed(4)} kJ/K
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5"><MathView math="S_{gen} = Q(1/T_L - 1/T_H)" /></div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Exergy Destroyed (<MathView math="I" />)</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            {exergyDestroyed.toFixed(1)} kJ
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">Gouy-Stodola: <MathView math="I = T_0 S_{gen}" /></div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Initial Avail. Energy</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
            {ae_initial.toFixed(1)} kJ
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">AE at <MathView math="T_H" /></div>
        </div>
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Final Avail. Energy</div>
          <div className="text-lg sm:text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {ae_final.toFixed(1)} kJ
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">AE at <MathView math="T_L" /></div>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe="As the temperature gap ΔT between the two reservoirs increases, the rate of entropy generation climbs steeply, and available exergy is permanently destroyed."
        reason="Heat conduction across a finite, non-zero temperature difference is inherently irreversible. Because heat leaving the hot source at $T_H$ has a smaller entropy decrease ($-\frac{Q}{T_H}$) than the entropy increase when entering the cold sink ($+\frac{Q}{T_L}$), the universe always experiences a net positive entropy generation: $S_{gen} = Q\left(\frac{1}{T_L} - \frac{1}{T_H}\right) > 0$."
        takeaway="Gouy-Stodola Theorem: Lost Work (Irreversibility) is strictly proportional to entropy generation: $I = W_{\text{lost}} = T_0 \cdot S_{\text{gen}}$. To preserve exergy in thermal machinery, minimize temperature differences across heat transfer interfaces."
        governingEquation="S_{\text{gen}} = \Delta S_{\text{universe}} = Q\left(\frac{1}{T_L} - \frac{1}{T_H}\right) \ge 0 \quad \text{and} \quad I = T_0 \cdot S_{\text{gen}}"
        stateValues={[
          { label: 'S_gen', value: `${entropyGenerated.toFixed(3)}`, unit: 'kJ/K', highlight: true },
          { label: 'Irreversibility (I)', value: `${exergyDestroyed.toFixed(1)}`, unit: 'kJ' },
          { label: 'Lost Exergy', value: `${lossInAE.toFixed(1)}`, unit: 'kJ' },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Entropy Generation & Gouy–Stodola Theorem"
        badge="ENTROPY & EXERGY REVISION"
        explanation="For any actual spontaneous process, the entropy of an isolated system (the thermodynamic universe) must always increase. The irreversibility (lost potential for useful work) is directly quantified by the Gouy–Stodola theorem."
        equation="S_{\text{gen}} = \Delta S_{\text{sys}} + \Delta S_{\text{surr}} \ge 0 \quad \text{and} \quad I = \dot{W}_{\text{lost}} = T_0 \cdot S_{\text{gen}}"
        secondaryEquation="S_{\text{gen}} = -\frac{Q}{T_H} + \frac{Q}{T_L} = Q\left(\frac{T_H - T_L}{T_H T_L}\right) > 0 \quad (T_H > T_L)"
        specialCases={[
          {
            label: 'Reversible Process (Ideal Limit)',
            condition: '\Delta T \to 0 \implies S_{\text{gen}} = 0',
            result: 'When heat is exchanged across an infinitesimal temperature difference, entropy generation is zero ($I = 0$), preserving 100% of available exergy.',
          },
          {
            label: 'Irreversible Heat Transfer',
            condition: 'T_H > T_L \implies S_{\text{gen}} > 0',
            result: 'Entropy is genuinely generated within the universe. Energy is fully conserved (1st Law), but its quality (exergy) is irreversibly degraded.',
          },
          {
            label: 'Impossible Process',
            condition: 'S_{\text{gen}} < 0 \implies \text{Violates 2nd Law}',
            result: 'A process that decreases universe entropy without external work input is strictly impossible in nature.',
          },
        ]}
        symbols={[
          { symbol: 'S_{\text{gen}}', name: 'Entropy Generated', unit: 'kJ/K', description: 'Measure of internal and external process irreversibility' },
          { symbol: 'I', name: 'Irreversibility / Lost Work', unit: 'kJ', description: 'Maximum theoretical useful work permanently forfeited: T0 · Sgen' },
          { symbol: 'T_0', name: 'Dead State Environment Temp', unit: 'Kelvin [K]', description: 'Ambient environmental reference temperature (typically 298.15 K)' },
          { symbol: 'Q', name: 'Heat Transferred Across ΔT', unit: 'kJ', description: 'Quantity of thermal energy transferred across the temperature gap' },
        ]}
        takeaway="Energy is conserved in ALL processes (First Law), but Exergy is destroyed in EVERY irreversible process (Second Law). Entropy generation is the sole thermodynamic metric that measures the irreversibility of a physical process."
        validity="Applies to all closed and open thermodynamic processes. The Gouy-Stodola theorem holds for any control volume surrounded by a constant-temperature environmental dead state at T0."
        variant="amber"
      />
    </div>
  );
};
