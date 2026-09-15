import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Flame, Snowflake, Link2, Unlink, Activity, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';

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

  // Initial block parameters
  const [matA, setMatA] = useState<string>('copper');
  const [tempA, setTempA] = useState<number>(350); // °C (Initial)
  const [massA, setMassA] = useState<number>(2.0); // kg

  const [matB, setMatB] = useState<string>('aluminum');
  const [tempB, setTempB] = useState<number>(25); // °C (Initial)
  const [massB, setMassB] = useState<number>(1.5); // kg

  // Active / connected state
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [contactProgress, setContactProgress] = useState<number>(0); // 0 (disconnected) to 1 (full equilibrium)
  const [timeHistory, setTimeHistory] = useState<Array<{ time: number; tempA: number; tempB: number }>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Equilibrium Temperature calculation
  // m_A * c_A * (T_A - T_eq) = m_B * c_B * (T_eq - T_B)
  // T_eq = (m_A*c_A*T_A + m_B*c_B*T_B) / (m_A*c_A + m_B*c_B)
  const cA = MATERIALS[matA].c;
  const cB = MATERIALS[matB].c;

  const equilibriumTemp = useMemo(() => {
    const heatCapA = massA * cA;
    const heatCapB = massB * cB;
    const tEq = (heatCapA * tempA + heatCapB * tempB) / (heatCapA + heatCapB);
    return Math.round(tEq * 10) / 10;
  }, [massA, cA, tempA, massB, cB, tempB]);

  // Current dynamic temperatures based on contactProgress
  const currentTempA = useMemo(() => {
    return Math.round((tempA + (equilibriumTemp - tempA) * (1 - Math.exp(-3 * contactProgress))) * 10) / 10;
  }, [tempA, equilibriumTemp, contactProgress]);

  const currentTempB = useMemo(() => {
    return Math.round((tempB + (equilibriumTemp - tempB) * (1 - Math.exp(-3 * contactProgress))) * 10) / 10;
  }, [tempB, equilibriumTemp, contactProgress]);

  // Total heat transferred: Q = m_A * c_A * (tempA - currentTempA)
  const heatTransferredKJ = useMemo(() => {
    const q = massA * cA * (tempA - currentTempA);
    return Math.round(Math.abs(q) * 10) / 10;
  }, [massA, cA, tempA, currentTempA]);

  // Connect / Thermal conduction ticker
  useEffect(() => {
    let animId: number;
    if (isConnected) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        setContactProgress((prev) => {
          if (prev >= 1.5) {
            clearInterval(interval);
            return 1.5;
          }
          const next = prev + 0.04;
          return next;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setContactProgress(0);
    }
  }, [isConnected]);

  // Update Recharts time history
  useEffect(() => {
    if (!isConnected) {
      // Initialize time 0
      setTimeHistory([
        { time: 0, tempA: tempA, tempB: tempB },
      ]);
      return;
    }

    // Generate curve for charting
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
    setTimeHistory(pts);
  }, [isConnected, tempA, tempB, equilibriumTemp]);

  // Canvas visual rendering of the two thermal blocks and heat flux
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

      // When connected, blocks move closer together or thermal bridge opens
      const blockAX = isConnected ? width / 2 - blockWidth - 15 : 40;
      const blockBX = isConnected ? width / 2 + 15 : width - blockWidth - 40;

      // Color mapping for Block A based on currentTempA
      const getTempColor = (t: number) => {
        // 0°C -> blue, 100°C -> amber, 400°C -> crimson/red
        if (t < 50) return isLightTheme ? '#0284c7' : '#38bdf8';
        if (t < 150) return isLightTheme ? '#d97706' : '#fbbf24';
        return isLightTheme ? '#e11d48' : '#f43f5e';
      };

      const colorA = getTempColor(currentTempA);
      const colorB = getTempColor(currentTempB);

      // 1. Draw Block A (Left)
      ctx.fillStyle = colorA;
      ctx.fillRect(blockAX, blockY, blockWidth, blockHeight);
      ctx.strokeStyle = isLightTheme ? '#334155' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(blockAX, blockY, blockWidth, blockHeight);

      // Label Block A
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const centerAX = blockAX + blockWidth / 2;
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText('SYSTEM A', centerAX, blockY + 30);
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`${MATERIALS[matA].name}`, centerAX, blockY + 50);
      ctx.font = 'bold 14px Fira Code, monospace';
      ctx.fillText(`${currentTempA}°C`, centerAX, blockY + 85);
      ctx.font = '10px Fira Code, monospace';
      ctx.fillText(`${massA} kg`, centerAX, blockY + 105);
      ctx.textAlign = 'left';

      // 2. Draw Block B (Right)
      ctx.fillStyle = colorB;
      ctx.fillRect(blockBX, blockY, blockWidth, blockHeight);
      ctx.strokeRect(blockBX, blockY, blockWidth, blockHeight);

      // Label Block B
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const centerBX = blockBX + blockWidth / 2;
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText('SYSTEM B', centerBX, blockY + 30);
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`${MATERIALS[matB].name}`, centerBX, blockY + 50);
      ctx.font = 'bold 14px Fira Code, monospace';
      ctx.fillText(`${currentTempB}°C`, centerBX, blockY + 85);
      ctx.font = '10px Fira Code, monospace';
      ctx.fillText(`${massB} kg`, centerBX, blockY + 105);
      ctx.textAlign = 'left';

      // 3. Draw Thermal Contact Conductor / Flux
      if (isConnected) {
        const bridgeX = blockAX + blockWidth;
        const bridgeW = blockBX - bridgeX;
        const bridgeY = blockY + 30;
        const bridgeH = 60;

        // Thermal gradient bridge
        const grad = ctx.createLinearGradient(bridgeX, 0, bridgeX + bridgeW, 0);
        grad.addColorStop(0, colorA);
        grad.addColorStop(1, colorB);
        ctx.fillStyle = grad;
        ctx.fillRect(bridgeX, bridgeY, bridgeW, bridgeH);
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 2;
        ctx.strokeRect(bridgeX, bridgeY, bridgeW, bridgeH);

        // Heat flux arrow particles
        particleOffset = (particleOffset + 1.5) % 30;
        ctx.fillStyle = '#ffffff';
        for (let x = bridgeX + 5; x < bridgeX + bridgeW - 5; x += 12) {
          ctx.beginPath();
          ctx.arc(x, bridgeY + bridgeH / 2, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
        ctx.fillText('HEAT FLUX Q →', bridgeX + 4, bridgeY - 8);
      } else {
        // Draw Diathermal barrier disconnected, centred in the gap between the blocks
        ctx.fillStyle = isLightTheme ? '#94a3b8' : '#475569';
        ctx.font = 'italic 11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Isolated (Adiabatic Wall)', width / 2, blockY + blockHeight + 22);
        ctx.textAlign = 'left';
      }

      // 4. Draw Zeroth Law Thermometer (System C) Probe at bottom
      const probeY = height - 35;
      const isEquil = Math.abs(currentTempA - currentTempB) < 0.5;
      const probeLabel = isEquil
        ? `System C: T_A = T_B = ${equilibriumTemp}°C (Equilibrium Reached)`
        : `Zeroth Law Probe: T_A ≠ T_B until equilibrium`;

      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      // Box is sized to the label so long readouts never spill past its border
      const probeW = Math.min(width - 20, ctx.measureText(probeLabel).width + 24);
      ctx.fillStyle = isLightTheme ? '#e2e8f0' : '#1e293b';
      ctx.fillRect(width / 2 - probeW / 2, probeY - 10, probeW, 26);
      ctx.strokeStyle = '#14b8a6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(width / 2 - probeW / 2, probeY - 10, probeW, 26);

      ctx.fillStyle = isLightTheme ? '#0d9488' : '#2dd4bf';
      ctx.textAlign = 'center';
      ctx.fillText(probeLabel, width / 2, probeY + 6);
      ctx.textAlign = 'left';

      if (isConnected && contactProgress < 1.5) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isConnected, currentTempA, currentTempB, matA, matB, massA, massB, equilibriumTemp, isDark, contactProgress]);

  const handleReset = () => {
    setIsConnected(false);
    setContactProgress(0);
    setTempA(350);
    setTempB(25);
    setMassA(2.0);
    setMassB(1.5);
  };

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Zeroth Law Thermal Equilibrium Lab
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Two isolated bodies exchanging thermal energy until reaching calculated equilibrium state <MathView math="T_A = T_B" />.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConnected(!isConnected)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
              isConnected
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-teal-600 hover:bg-teal-500 animate-pulse'
            }`}
          >
            {isConnected ? <Unlink className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
            <span>{isConnected ? 'Disconnect Blocks' : 'Connect & Exchange Heat'}</span>
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Reset Lab"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Visual Thermal Contact Chamber & Temperature Convergence Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Canvas Blocks (6 cols) */}
        <div className="lg:col-span-6 bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
          <canvas
            ref={canvasRef}
            width={380}
            height={260}
            className="w-full max-w-[380px] h-auto rounded-xl shadow-inner"
          />
          <div className="flex items-center justify-between w-full mt-2 px-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
            <span>Block A: {currentTempA}°C</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">
              {Math.abs(currentTempA - currentTempB) < 0.5 ? '✓ Thermal Equilibrium' : 'Conduction Active'}
            </span>
            <span>Block B: {currentTempB}°C</span>
          </div>
        </div>

        {/* Right: Recharts Temperature vs Time Curve (6 cols) */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/90 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-500" />
              <span>Temperature Equilibrium Curve <MathView math="T(t)" /></span>
            </h4>
            <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400">
              <MathView math="T_{eq}" /> = {equilibriumTemp} °C
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeHistory} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis
                  dataKey="time"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Contact Time (s)', position: 'insideBottomRight', offset: -5, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white text-xs p-2 rounded-lg border border-slate-700 font-mono shadow-lg">
                          <p className="text-rose-400">Block A: {payload[0]?.value} °C</p>
                          <p className="text-cyan-400">Block B: {payload[1]?.value} °C</p>
                          <p className="text-teal-300 font-bold">Target Eq: {equilibriumTemp} °C</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="tempA" name="Block A Temperature" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="tempB" name="Block B Temperature" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Control Sliders for Block A and Block B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Block A Controls */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-rose-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Block A (Hot Reservoir)
            </span>
            <select
              value={matA}
              onChange={(e) => setMatA(e.target.value)}
              className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {Object.keys(MATERIALS).map((k) => (
                <option key={k} value={k}>
                  {MATERIALS[k].name} (c={MATERIALS[k].c} kJ/kg·K)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Initial Temperature (<MathView math="T_A" />)</span>
              <span className="font-mono font-bold text-rose-600">{tempA} °C</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="5"
              value={tempA}
              disabled={isConnected}
              onChange={(e) => setTempA(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 disabled:opacity-40"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
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
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500 disabled:opacity-40"
            />
          </div>
        </div>

        {/* Block B Controls */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-cyan-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="font-bold text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5" /> Block B (Cold Reservoir)
            </span>
            <select
              value={matB}
              onChange={(e) => setMatB(e.target.value)}
              className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              {Object.keys(MATERIALS).map((k) => (
                <option key={k} value={k}>
                  {MATERIALS[k].name} (c={MATERIALS[k].c} kJ/kg·K)
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">Initial Temperature (<MathView math="T_B" />)</span>
              <span className="font-mono font-bold text-cyan-600">{tempB} °C</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={tempB}
              disabled={isConnected}
              onChange={(e) => setTempB(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
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
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500 disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* Readout Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Equilibrium <MathView math="T_f" /></div>
          <div className="text-base font-bold font-mono text-teal-600 dark:text-teal-400">{equilibriumTemp} °C</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">{(equilibriumTemp + 273.15).toFixed(1)} K</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Heat Exchanged (<MathView math="Q" />)</div>
          <div className="text-base font-bold font-mono text-rose-600 dark:text-rose-400">{heatTransferredKJ} kJ</div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400">A → B transfer</div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Block A Heat Capacity</div>
          <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
            {(massA * cA).toFixed(2)} kJ/K
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="C_A = m_A c_A" /></div>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 uppercase font-semibold">Block B Heat Capacity</div>
          <div className="text-base font-bold font-mono text-slate-800 dark:text-slate-200">
            {(massB * cB).toFixed(2)} kJ/K
          </div>
          <div className="text-[10px] text-slate-600 dark:text-slate-400"><MathView math="C_B = m_B c_B" /></div>
        </div>
      </div>

      {/* Key Takeaway Box */}
      <div className="bg-sky-50/70 dark:bg-sky-500/5 border border-sky-200 dark:border-sky-500/20 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300">
          <span>⚡</span> Quick Revision — Zeroth Law & Thermal Equilibrium
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-sky-100 dark:border-sky-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Zeroth Law Statement:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">If bodies A and B are in thermal equilibrium with C separately, then A and B are in thermal equilibrium with each other.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-sky-100 dark:border-sky-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Thermometry Principle:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Body C acts as the thermometer. Temperature is the unique property whose equality defines thermal equilibrium.</div>
          </div>
          <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-sky-100 dark:border-sky-900/40">
            <span className="font-bold text-slate-900 dark:text-slate-100">Equilibrium Temperature:</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">T_f = (m_A c_A T_A + m_B c_B T_B) / (m_A c_A + m_B c_B). Heat gained equals heat lost in an isolated enclosure.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
