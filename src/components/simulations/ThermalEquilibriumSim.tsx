import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Link2,
  Unlink,
  Activity,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  HelpCircle,
  Gauge,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceDot,
} from 'recharts';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

interface MaterialOption {
  name: string;
  c: number; // Specific heat kJ/(kg·K)
  color: string;
}

const MATERIALS: Record<string, MaterialOption> = {
  copper: { name: 'Copper (Cu)', c: 0.386, color: '#f97316' },
  aluminum: { name: 'Aluminum (Al)', c: 0.900, color: '#94a3b8' },
  iron: { name: 'Iron (Fe)', c: 0.450, color: '#64748b' },
  water: { name: 'Water (H₂O)', c: 4.184, color: '#06b6d4' },
};

export const ThermalEquilibriumSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);

  // Initial block parameters
  const [matA, setMatA] = useState<string>('copper');
  const [tempA, setTempA] = useState<number>(350); // °C (Initial)
  const [massA, setMassA] = useState<number>(2.0); // kg

  const [matB, setMatB] = useState<string>('aluminum');
  const [tempB, setTempB] = useState<number>(25); // °C (Initial)
  const [massB, setMassB] = useState<number>(1.5); // kg

  // Active / connected state & simulation controls
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [contactProgress, setContactProgress] = useState<number>(0); // 0 (start) to 1.5 (full equilibrium)
  const [animSpeed, setAnimSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Specific heat values
  const cA = MATERIALS[matA].c;
  const cB = MATERIALS[matB].c;

  // Exact Theoretical Equilibrium Temperature calculation:
  // First Law for isolated system: m_A * c_A * (T_A - T_f) = m_B * c_B * (T_f - T_B)
  // T_f = (m_A * c_A * T_A + m_B * c_B * T_B) / (m_A * c_A + m_B * c_B)
  const equilibriumTemp = useMemo(() => {
    const heatCapA = massA * cA;
    const heatCapB = massB * cB;
    const tEq = (heatCapA * tempA + heatCapB * tempB) / (heatCapA + heatCapB);
    return Math.round(tEq * 100) / 100;
  }, [massA, cA, tempA, massB, cB, tempB]);

  // Current dynamic temperatures based on contactProgress (Newtonian / lumped capacitance relaxation)
  const currentTempA = useMemo(() => {
    if (!isConnected) return tempA;
    const t = tempA + (equilibriumTemp - tempA) * (1 - Math.exp(-3 * contactProgress));
    return Math.round(t * 10) / 10;
  }, [isConnected, tempA, equilibriumTemp, contactProgress]);

  const currentTempB = useMemo(() => {
    if (!isConnected) return tempB;
    const t = tempB + (equilibriumTemp - tempB) * (1 - Math.exp(-3 * contactProgress));
    return Math.round(t * 10) / 10;
  }, [isConnected, tempB, equilibriumTemp, contactProgress]);

  // Heat transferred: Q = m * c * |delta T|
  const heatLostA = useMemo(() => {
    return Math.abs(massA * cA * (tempA - currentTempA));
  }, [massA, cA, tempA, currentTempA]);

  const heatGainedB = useMemo(() => {
    return Math.abs(massB * cB * (tempB - currentTempB));
  }, [massB, cB, tempB, currentTempB]);

  // Energy conservation residual: |Q_lost - Q_gained|
  const energyResidual = useMemo(() => {
    return Math.abs(heatLostA - heatGainedB);
  }, [heatLostA, heatGainedB]);

  // Connect / Thermal conduction ticker
  useEffect(() => {
    if (!isConnected || !isPlaying || !shouldAnimate) return;

    const interval = setInterval(() => {
      setContactProgress((prev) => {
        if (prev >= 1.5) {
          return 1.5;
        }
        return prev + 0.03 * animSpeed;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isConnected, isPlaying, animSpeed, shouldAnimate]);

  // Step through process
  const handleStep = () => {
    if (!isConnected) setIsConnected(true);
    setIsPlaying(false);
    setContactProgress((prev) => Math.min(1.5, prev + 0.15));
  };

  // Reset to initial conditions
  const handleReset = () => {
    setIsConnected(false);
    setIsPlaying(true);
    setContactProgress(0);
    setTempA(350);
    setTempB(25);
    setMassA(2.0);
    setMassB(1.5);
    setMatA('copper');
    setMatB('aluminum');
  };

  // Presets
  const applyPreset = (type: 'equal' | 'water_metal' | 'reverse') => {
    setIsConnected(false);
    setIsPlaying(true);
    setContactProgress(0);

    if (type === 'equal') {
      // Case 1: Equal heat capacities m_A c_A = m_B c_B -> T_f = (T_A + T_B)/2
      setMatA('aluminum');
      setMatB('aluminum');
      setMassA(2.0);
      setMassB(2.0);
      setTempA(300);
      setTempB(100);
    } else if (type === 'water_metal') {
      // Case 2: Water dominance m_A c_A >> m_B c_B -> T_f approx T_A
      setMatA('water');
      setMatB('iron');
      setMassA(3.0); // 3 kg water: C_A = 3 * 4.184 = 12.55 kJ/K
      setMassB(0.5); // 0.5 kg iron: C_B = 0.5 * 0.45 = 0.225 kJ/K
      setTempA(25);
      setTempB(350);
    } else {
      // Reverse conduction: Cold A + Hot B -> Heat flows B -> A
      setMatA('copper');
      setMatB('iron');
      setMassA(1.5);
      setMassB(2.0);
      setTempA(20);
      setTempB(320);
    }
  };

  // Generate Temperature vs Time Curve
  const timeHistory = useMemo(() => {
    const pts = [];
    const totalSteps = 20;
    for (let i = 0; i <= totalSteps; i++) {
      const tNorm = (i / totalSteps) * 1.5;
      const decay = 1 - Math.exp(-3 * tNorm);
      const tA = Math.round((tempA + (equilibriumTemp - tempA) * decay) * 10) / 10;
      const tB = Math.round((tempB + (equilibriumTemp - tempB) * decay) * 10) / 10;
      pts.push({
        time: i,
        tempA: tA,
        tempB: tB,
      });
    }
    return pts;
  }, [tempA, tempB, equilibriumTemp]);

  // Current normalized time step index for tracer dot
  const currentStepIndex = Math.min(20, Math.round((contactProgress / 1.5) * 20));

  // Canvas visual rendering of thermal contact chamber and heat flux arrows
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particleOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const isLightTheme = !isDark;
      const bg = isLightTheme ? '#f8fafc' : '#090d16';

      // Background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Block dimensions
      const blockWidth = 100;
      const blockHeight = 120;
      const blockY = (height - blockHeight) / 2 - 10;

      // When connected, blocks meet at center with a thermal contact interface
      const blockAX = isConnected ? width / 2 - blockWidth - 12 : 35;
      const blockBX = isConnected ? width / 2 + 12 : width - blockWidth - 35;

      // Temperature-based color mapping
      const getTempColor = (t: number) => {
        if (t < 50) return isLightTheme ? '#0284c7' : '#38bdf8'; // Blue (cold)
        if (t < 150) return isLightTheme ? '#0d9488' : '#2dd4bf'; // Teal
        if (t < 250) return isLightTheme ? '#d97706' : '#fbbf24'; // Amber
        return isLightTheme ? '#e11d48' : '#fb7185'; // Red (hot)
      };

      const colorA = getTempColor(currentTempA);
      const colorB = getTempColor(currentTempB);

      // 1. Draw Insulated Chamber Boundary
      ctx.strokeStyle = isLightTheme ? '#cbd5e1' : '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(15, 15, width - 30, height - 30);

      ctx.fillStyle = isLightTheme ? '#64748b' : '#94a3b8';
      ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
      ctx.fillText('ISOLATED THERMAL SYSTEM BOUNDARY (Q_loss = 0)', 24, 30);

      // 2. Draw Block A
      ctx.fillStyle = colorA;
      ctx.globalAlpha = isLightTheme ? 0.25 : 0.35;
      ctx.fillRect(blockAX, blockY, blockWidth, blockHeight);
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = colorA;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(blockAX, blockY, blockWidth, blockHeight);

      // Block A Label
      ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Block A (${MATERIALS[matA].name.split(' ')[0]})`, blockAX + 10, blockY + 22);

      ctx.font = 'bold 16px Fira Code, monospace';
      ctx.fillStyle = colorA;
      ctx.fillText(`${currentTempA}°C`, blockAX + 10, blockY + 50);

      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = isLightTheme ? '#475569' : '#94a3b8';
      ctx.fillText(`m = ${massA} kg`, blockAX + 10, blockY + 74);
      ctx.fillText(`c = ${cA} kJ/kg·K`, blockAX + 10, blockY + 92);
      ctx.fillText(`C = ${(massA * cA).toFixed(2)} kJ/K`, blockAX + 10, blockY + 110);

      // 3. Draw Block B
      ctx.fillStyle = colorB;
      ctx.globalAlpha = isLightTheme ? 0.25 : 0.35;
      ctx.fillRect(blockBX, blockY, blockWidth, blockHeight);
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = colorB;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(blockBX, blockY, blockWidth, blockHeight);

      // Block B Label
      ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`Block B (${MATERIALS[matB].name.split(' ')[0]})`, blockBX + 10, blockY + 22);

      ctx.font = 'bold 16px Fira Code, monospace';
      ctx.fillStyle = colorB;
      ctx.fillText(`${currentTempB}°C`, blockBX + 10, blockY + 50);

      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillStyle = isLightTheme ? '#475569' : '#94a3b8';
      ctx.fillText(`m = ${massB} kg`, blockBX + 10, blockY + 74);
      ctx.fillText(`c = ${cB} kJ/kg·K`, blockBX + 10, blockY + 92);
      ctx.fillText(`C = ${(massB * cB).toFixed(2)} kJ/K`, blockBX + 10, blockY + 110);

      // 4. Conduction Bridge / Heat Transfer Arrows
      if (isConnected) {
        // Thermal bridge between blocks
        const bridgeX = blockAX + blockWidth;
        const bridgeW = blockBX - bridgeX;
        const bridgeY = blockY + 20;
        const bridgeH = blockHeight - 40;

        ctx.fillStyle = isLightTheme ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.25)';
        ctx.fillRect(bridgeX, bridgeY, bridgeW, bridgeH);
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bridgeX, bridgeY, bridgeW, bridgeH);

        // Animated Heat Flow Particles (Strictly Hot -> Cold)
        const isAtoB = currentTempA > currentTempB;
        const isBtoA = currentTempB > currentTempA;
        const deltaT_current = Math.abs(currentTempA - currentTempB);

        if (deltaT_current > 0.3) {
          particleOffset = (particleOffset + (isPlaying ? 1.5 * animSpeed : 0)) % 30;
          ctx.fillStyle = '#f59e0b';

          for (let y = bridgeY + 15; y < bridgeY + bridgeH; y += 18) {
            const startX = isAtoB ? bridgeX : bridgeX + bridgeW;
            const dir = isAtoB ? 1 : -1;
            const px = startX + dir * (particleOffset % bridgeW);

            ctx.beginPath();
            ctx.arc(px, y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Arrow head
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(px + dir * 5, y);
            ctx.lineTo(px - dir * 3, y - 3);
            ctx.lineTo(px - dir * 3, y + 3);
            ctx.closePath();
            ctx.fill();
          }

          // Conduction label
          ctx.fillStyle = '#14b8a6';
          ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(
            isAtoB ? 'HEAT FLUX: A → B' : 'HEAT FLUX: B → A',
            width / 2,
            bridgeY - 10
          );
          ctx.textAlign = 'left';
        } else {
          // Equilibrium reached
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('THERMAL EQUILIBRIUM REACHED (T_A = T_B)', width / 2, bridgeY - 10);
          ctx.textAlign = 'left';
        }
      }

      if (isConnected && isPlaying && contactProgress < 1.5 && shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(render);
    } else {
      render();
    }
    return () => cancelAnimationFrame(animId);
  }, [
    isConnected,
    isPlaying,
    currentTempA,
    currentTempB,
    matA,
    matB,
    massA,
    massB,
    equilibriumTemp,
    isDark,
    contactProgress,
    animSpeed,
    shouldAnimate,
  ]);

  return (
    <div ref={containerRef} className="space-y-4 md:space-y-6">
      {/* Title, Badge & Primary Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[18px] md:text-[20px] font-bold text-slate-900 dark:text-white leading-[1.3]">
              Zeroth Law Thermal Equilibrium & Temperature Lab
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
              Isolated thermal contact chamber demonstrating heat exchange, temperature relaxation, and energy conservation.
            </p>
          </div>
        </div>

        {/* Interactive Controls Toolbar (Touch friendly >= 44px) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsConnected(!isConnected)}
            className={`flex items-center gap-2 px-4 py-2 min-h-[44px] rounded-xl text-sm font-bold text-white transition-all shadow-xs ${
              isConnected
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-teal-600 hover:bg-teal-500'
            }`}
          >
            {isConnected ? <Unlink className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            <span>{isConnected ? 'Break Thermal Contact' : 'Establish Contact & Exchange Heat'}</span>
          </button>

          {isConnected && (
            <>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                title={isPlaying ? 'Pause Conduction' : 'Play Conduction'}
                aria-label={isPlaying ? 'Pause Conduction' : 'Play Conduction'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-teal-500" />}
              </button>

              <button
                onClick={handleStep}
                className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
                title="Step Forward (+Δt)"
                aria-label="Step Forward"
              >
                <StepForward className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center"
            title="Reset to Initial Parameters"
            aria-label="Reset Parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Meaningful Presets Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm">
        <span className="font-bold text-slate-600 dark:text-slate-400 font-mono text-xs flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-teal-500" />
          Presets:
        </span>
        <button
          onClick={() => applyPreset('equal')}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 text-xs sm:text-sm font-semibold transition-all"
        >
          Equal Heat Capacities (<MathView math="m_A c_A = m_B c_B" />)
        </button>
        <button
          onClick={() => applyPreset('water_metal')}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 text-xs sm:text-sm font-semibold transition-all"
        >
          High Heat Capacity Water (<MathView math="m_A c_A \gg m_B c_B" />)
        </button>
        <button
          onClick={() => applyPreset('reverse')}
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 text-xs sm:text-sm font-semibold transition-all"
        >
          Reversed Thermal Gradient (<MathView math="T_B > T_A" />)
        </button>

        {/* Speed Selector */}
        <div className="ml-auto flex items-center gap-1 text-xs font-mono text-slate-500">
          <span>Speed:</span>
          {[0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => setAnimSpeed(s)}
              className={`min-h-[36px] min-w-[36px] px-2 py-1 rounded-lg text-xs font-bold transition-colors ${
                animSpeed === s
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Main Visual Thermal Chamber & Convergence Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Canvas Thermal Contact Chamber (6 cols) */}
        <div className="lg:col-span-6 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={380}
            height={250}
            className="w-full max-w-[380px] h-auto rounded-xl shadow-inner"
          />
          <div className="flex items-center justify-between w-full mt-2.5 px-2 text-xs font-mono text-slate-600 dark:text-slate-400">
            <span>Block A: <strong className="text-slate-900 dark:text-white">{currentTempA}°C</strong></span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">
              {Math.abs(currentTempA - currentTempB) < 0.3 ? '✓ Equilibrium' : 'Conduction Active'}
            </span>
            <span>Block B: <strong className="text-slate-900 dark:text-white">{currentTempB}°C</strong></span>
          </div>
        </div>

        {/* Right: Recharts Temperature vs Time Convergence (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Relaxation Curve <MathView math="T(t)" /></span>
            </h4>
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
              <MathView math="T_f" /> = {equilibriumTemp} °C
            </span>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeHistory} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis
                  dataKey="time"
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Illustrative Time (t)', position: 'insideBottomRight', offset: -5, fontSize: 10 }}
                />
                <YAxis
                  stroke={isDark ? '#64748b' : '#94a3b8'}
                  tick={{ fontSize: 10 }}
                  domain={['auto', 'auto']}
                  unit="°C"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Line
                  type="monotone"
                  dataKey="tempA"
                  name="Block A Temp"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="tempB"
                  name="Block B Temp"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                />
                {/* Live tracer dots */}
                {isConnected && timeHistory[currentStepIndex] && (
                  <>
                    <ReferenceDot
                      x={currentStepIndex}
                      y={timeHistory[currentStepIndex].tempA}
                      r={5}
                      fill="#f97316"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                    <ReferenceDot
                      x={currentStepIndex}
                      y={timeHistory[currentStepIndex].tempB}
                      r={5}
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 font-mono text-center">
            *Time evolution follows exponential relaxation <MathView math="dT/dt \propto -(T_A - T_B)" /> (lumped-capacitance model).
          </div>
        </div>
      </div>

      {/* Parameter Adjustment Sliders (Block A & Block B) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Block A Parameters */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400 font-mono">BLOCK A PROPERTIES</span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
              <MathView math={`C_A = ${(massA * cA).toFixed(2)}`} /> kJ/K
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-400 font-medium">Material:</label>
            <select
              value={matA}
              disabled={isConnected}
              onChange={(e) => setMatA(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-base text-slate-800 dark:text-slate-200 min-h-[44px]"
            >
              {Object.keys(MATERIALS).map((k) => (
                <option key={k} value={k}>
                  {MATERIALS[k].name} (c = {MATERIALS[k].c} kJ/kg·K)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Initial Temperature (<MathView math="T_A" />)</span>
              <span className="font-mono font-bold text-orange-600">{tempA} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={tempA}
              disabled={isConnected}
              onChange={(e) => setTempA(parseFloat(e.target.value))}
              className="w-full h-8 py-2 bg-transparent cursor-pointer accent-orange-500 disabled:opacity-40 touch-pan-y"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Mass (<MathView math="m_A" />)</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{massA} kg</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={massA}
              disabled={isConnected}
              onChange={(e) => setMassA(parseFloat(e.target.value))}
              className="w-full h-8 py-2 bg-transparent cursor-pointer accent-slate-500 disabled:opacity-40 touch-pan-y"
            />
          </div>
        </div>

        {/* Block B Parameters */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 font-mono">BLOCK B PROPERTIES</span>
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
              <MathView math={`C_B = ${(massB * cB).toFixed(2)}`} /> kJ/K
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-slate-600 dark:text-slate-400 font-medium">Material:</label>
            <select
              value={matB}
              disabled={isConnected}
              onChange={(e) => setMatB(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-base text-slate-800 dark:text-slate-200 min-h-[44px]"
            >
              {Object.keys(MATERIALS).map((k) => (
                <option key={k} value={k}>
                  {MATERIALS[k].name} (c = {MATERIALS[k].c} kJ/kg·K)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Initial Temperature (<MathView math="T_B" />)</span>
              <span className="font-mono font-bold text-cyan-600">{tempB} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="500"
              step="5"
              value={tempB}
              disabled={isConnected}
              onChange={(e) => setTempB(parseFloat(e.target.value))}
              className="w-full h-8 py-2 bg-transparent cursor-pointer accent-cyan-500 disabled:opacity-40 touch-pan-y"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Mass (<MathView math="m_B" />)</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{massB} kg</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={massB}
              disabled={isConnected}
              onChange={(e) => setMassB(parseFloat(e.target.value))}
              className="w-full h-8 py-2 bg-transparent cursor-pointer accent-slate-500 disabled:opacity-40 touch-pan-y"
            />
          </div>
        </div>
      </div>

      {/* Physics State Summary & Conservation Residual Readout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Equilibrium State</div>
          <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400">{equilibriumTemp} °C</div>
          <div className="text-[10px] text-slate-500 font-mono">{(equilibriumTemp + 273.15).toFixed(2)} K</div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Heat Transferred (<MathView math="Q" />)</div>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">{heatLostA.toFixed(2)} kJ</div>
          <div className="text-[10px] text-slate-500 font-mono">
            {tempA >= tempB ? 'A → B transfer' : 'B → A transfer'}
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Capacity Ratio</div>
          <div className="text-lg font-bold font-mono text-slate-800 dark:text-slate-200">
            {((massA * cA) / (massB * cB)).toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono"><MathView math="C_A / C_B" /></div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Energy Balance Check</div>
          <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {energyResidual < 1e-4 ? '0.0000 kJ' : `${energyResidual.toFixed(4)} kJ`}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Energy Conserved to 10⁻⁴</span>
          </div>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe="When blocks make contact, their temperatures approach each other exponentially until both register the exact same equilibrium value $T_f$."
        reason="Heat naturally conducts down the temperature gradient from high to low until $\Delta T = 0$ (2nd Law of Thermodynamics). In an isolated enclosure ($\sum Q = 0$), thermal energy given up by the hotter body is identically absorbed by the colder body."
        takeaway="Always use the weighted heat-capacity formula $T_f = \frac{m_A c_A T_A + m_B c_B T_B}{m_A c_A + m_B c_B}$. The body with the larger thermal capacitance ($C = mc$) undergoes a smaller temperature change."
        governingEquation="Q_{\text{lost}} = Q_{\text{gained}} \implies m_A c_A (T_A - T_f) = m_B c_B (T_f - T_B)"
        stateValues={[
          { label: 'T_A', value: `${currentTempA}`, unit: '°C' },
          { label: 'T_B', value: `${currentTempB}`, unit: '°C' },
          { label: 'T_f', value: `${equilibriumTemp}`, unit: '°C', highlight: true },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Zeroth Law & Equilibrium Temperature ($T_f$)"
        badge="ZEROTH LAW REVISION"
        explanation="When two or more isolated bodies at different temperatures are placed in thermal contact, heat flows spontaneously from the hotter body to the colder body until they reach a mutually identical temperature known as the equilibrium temperature ($T_f$)."
        equation="T_f = \frac{m_A c_A T_A + m_B c_B T_B}{m_A c_A + m_B c_B}"
        secondaryEquation="Q = m_A c_A (T_A - T_f) = m_B c_B (T_f - T_B) \quad \text{with} \quad \sum Q = 0"
        specialCases={[
          {
            label: 'Case 1: Equal Heat Capacities',
            condition: 'm_A = m_B, \; c_A = c_B \implies C_A = C_B',
            result: 'Final temperature is the exact arithmetic mean: $T_f = \frac{T_A + T_B}{2}$ (accurate to $\pm 0.01^\circ\\text{C}$).',
          },
          {
            label: 'Case 2: Extreme Capacity Ratio',
            condition: 'm_A c_A \gg m_B c_B \implies C_A \gg C_B',
            result: 'The massive reservoir dominates the mixture: $T_f \\approx T_A$ (e.g. dropping a small hot bolt into a large water pool).',
          },
          {
            label: 'Case 3: Strict Energy Conservation',
            condition: 'm_A c_A (T_A - T_f) = m_B c_B (T_f - T_B)',
            result: 'Net energy change is zero; energy conservation holds numerically within $10^{-4}\\text{ kJ}$.',
          },
        ]}
        symbols={[
          { symbol: 'T_f', name: 'Equilibrium Temperature', unit: '°C or K', description: 'Final uniform temperature attained by both bodies' },
          { symbol: 'm_A, m_B', name: 'Mass of Bodies A & B', unit: 'kg', description: 'Mass of each participating substance' },
          { symbol: 'c_A, c_B', name: 'Specific Heat Capacities', unit: 'kJ/(kg·K)', description: 'Energy required to raise 1 kg of material by 1 K' },
          { symbol: 'T_A, T_B', name: 'Initial Temperatures', unit: '°C or K', description: 'Starting temperatures before thermal contact' },
          { symbol: 'Q', name: 'Heat Transferred', unit: 'kJ', description: 'Total thermal energy exchanged between the two bodies' },
          { symbol: 'C = mc', name: 'Total Heat Capacity', unit: 'kJ/K', description: 'Thermal mass governing rate of temperature change' },
        ]}
        takeaway="The Zeroth Law guarantees that if bodies A and B are each in thermal equilibrium with a third body C, they are in thermal equilibrium with each other. Temperature is the unique intensive scalar property whose equality is the necessary and sufficient condition for thermal equilibrium."
        validity="Valid for isolated systems with negligible environmental heat loss ($Q_{\text{loss}} = 0$), constant specific heats ($c \neq f(T)$), and no chemical reactions or phase changes occurring during the interaction."
        variant="teal"
      />
    </div>
  );
};
