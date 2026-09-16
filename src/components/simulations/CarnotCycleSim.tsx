import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Flame,
  Snowflake,
  Zap,
  RefreshCw,
  Gauge,
  Sliders,
  CheckCircle2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export const CarnotCycleSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);

  // Operating parameters
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cycleTime, setCycleTime] = useState<number>(0); // 0 to 4 (continuous or stepped)
  const [tHigh, setTHigh] = useState<number>(600); // K (High temperature reservoir)
  const [tLow, setTLow] = useState<number>(300); // K (Low temperature sink)
  const [heatIn, setHeatIn] = useState<number>(1000); // kJ
  const [mode, setMode] = useState<'engine' | 'refrigerator' | 'heatpump'>('engine');
  const [animSpeed, setAnimSpeed] = useState<number>(1.0); // 0.5x, 1.0x, 2.0x

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Exact Carnot Thermodynamic Performance Calculations:
  // Heat Engine: eta = 1 - T_L / T_H = W_net / Q_in
  // Refrigerator: COP_R = T_L / (T_H - T_L) = Q_L / W_net
  // Heat Pump: COP_HP = T_H / (T_H - T_L) = Q_H / W_net = COP_R + 1
  const efficiency = useMemo(() => 1 - tLow / tHigh, [tLow, tHigh]);
  const workNet = useMemo(() => heatIn * efficiency, [heatIn, efficiency]);
  const heatOut = useMemo(() => heatIn - workNet, [heatIn, workNet]);
  const copRef = useMemo(() => tLow / (tHigh - tLow), [tLow, tHigh]);
  const copHP = useMemo(() => tHigh / (tHigh - tLow), [tLow, tHigh]);

  // Animation ticker
  useEffect(() => {
    let animId: number;
    const baseSpeed = 0.008 * animSpeed;

    const tick = () => {
      if (isPlaying && shouldAnimate) {
        setCycleTime((prev) => (prev + baseSpeed) % 4);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, animSpeed, shouldAnimate]);

  // Current stage in 4-process cycle
  const currentStage = Math.floor(cycleTime); // 0: 1->2, 1: 2->3, 2: 3->4, 3: 4->1
  const stageFraction = cycleTime - currentStage;

  // Step through process stage by stage
  const handleStepStage = () => {
    setIsPlaying(false);
    setCycleTime((prev) => (Math.floor(prev) + 1) % 4);
  };

  const setStageDirect = (stageIdx: number) => {
    setIsPlaying(false);
    setCycleTime(stageIdx + 0.01);
  };

  // Presets
  const applyPreset = (preset: 'power_plant' | 'cryo_ref' | 'ambient_engine' | 'heat_pump') => {
    if (preset === 'power_plant') {
      setMode('engine');
      setTHigh(800);
      setTLow(300);
      setHeatIn(1200);
    } else if (preset === 'cryo_ref') {
      setMode('refrigerator');
      setTHigh(300);
      setTLow(77); // Liquid Nitrogen temperature
      setHeatIn(800);
    } else if (preset === 'ambient_engine') {
      setMode('engine');
      setTHigh(500);
      setTLow(300);
      setHeatIn(1000);
    } else {
      setMode('heatpump');
      setTHigh(295); // 22 °C building interior
      setTLow(270); // -3 °C winter ambient
      setHeatIn(1000);
    }
  };

  // Reset
  const handleReset = () => {
    setTHigh(600);
    setTLow(300);
    setHeatIn(1000);
    setMode('engine');
    setCycleTime(0);
    setIsPlaying(true);
  };

  const stageDescriptions = [
    {
      title: 'Process 1-2: Reversible Isothermal Heat Addition',
      desc: `Gas absorbs heat $Q_{in} = ${heatIn}\\text{ kJ}$ reversibly from high-temperature reservoir at constant $T_H = ${tHigh}\\text{ K}$. Volume expands reversibly doing maximum boundary work.`,
      tempState: `$T = T_H = ${tHigh}\\text{ K}$ (Constant)`,
      heatWork: `Heat Absorbed: $+${heatIn}\\text{ kJ}$, Work Produced: $+${(heatIn * 0.45).toFixed(0)}\\text{ kJ}$`,
    },
    {
      title: 'Process 2-3: Reversible Adiabatic (Isentropic) Expansion',
      desc: `Insulated from all heat ($Q = 0$). Gas continues expanding, producing work solely by depleting its internal energy. Temperature drops from $T_H = ${tHigh}\\text{ K} \\to T_L = ${tLow}\\text{ K}$.`,
      tempState: `$T$ drops: $${tHigh}\\text{ K} \\to ${tLow}\\text{ K}$`,
      heatWork: `Heat $Q = 0$, Adiabatic Work: $+${(workNet - heatIn * 0.45 + heatOut * 0.45).toFixed(0)}\\text{ kJ}$`,
    },
    {
      title: 'Process 3-4: Reversible Isothermal Heat Rejection',
      desc: `Gas is compressed isothermally at $T_L = ${tLow}\\text{ K}$, rejecting waste heat $Q_{out} = ${heatOut.toFixed(1)}\\text{ kJ}$ to the low-temperature reservoir.`,
      tempState: `$T = T_L = ${tLow}\\text{ K}$ (Constant)`,
      heatWork: `Heat Rejected: $-${heatOut.toFixed(1)}\\text{ kJ}$, Work Done on Gas: $-${(heatOut * 0.45).toFixed(0)}\\text{ kJ}$`,
    },
    {
      title: 'Process 4-1: Reversible Adiabatic (Isentropic) Compression',
      desc: `Insulated from all reservoirs ($Q = 0$). Work is done on the gas to compress it back to state 1, raising temperature from $T_L = ${tLow}\\text{ K} \\to T_H = ${tHigh}\\text{ K}$ to complete the cycle.`,
      tempState: `$T$ rises: $${tLow}\\text{ K} \\to ${tHigh}\\text{ K}$`,
      heatWork: `Heat $Q = 0$, Work Input: $-${(workNet * 0.55).toFixed(0)}\\text{ kJ}$`,
    },
  ];

  // Draw synchronized dual P-V and T-S diagram + Engine Graphic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;

    const ct = getCanvasTheme();
    const isLightTheme = !isDark;

    // Background
    ctx.fillStyle = ct.bg;
    ctx.fillRect(0, 0, width, height);

    // Layout: Left: T-S Diagram, Right: P-V Diagram
    const halfW = width / 2;

    // 1. Left: T-S Diagram (Carnot Rectangle)
    const tsLeft = 45;
    const tsRight = halfW - 25;
    const tsBottom = height - 50;
    const tsTop = 45;
    const tsW = tsRight - tsLeft;
    const tsH = tsBottom - tsTop;

    // T-S Axes
    ctx.strokeStyle = ct.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tsLeft, tsTop);
    ctx.lineTo(tsLeft, tsBottom);
    ctx.lineTo(tsRight, tsBottom);
    ctx.stroke();

    ctx.fillStyle = ct.axisLabel;
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Temperature T (K)', tsLeft - 10, tsTop - 10);
    ctx.fillText('Entropy S (kJ/K) →', tsRight - 55, tsBottom + 25);
    ctx.fillText('T-S DIAGRAM (CARNOT RECTANGLE)', tsLeft, 22);

    // T-S Coordinates
    const s1 = tsLeft + tsW * 0.25;
    const s2 = tsLeft + tsW * 0.8;
    const t_high_y = tsBottom - (tHigh / 900) * tsH;
    const t_low_y = tsBottom - (tLow / 900) * tsH;

    // Fill Area under cycle on T-S (Net Work Area)
    ctx.fillStyle = isLightTheme ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(s1, t_high_y, s2 - s1, t_low_y - t_high_y);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(s1, t_high_y, s2 - s1, t_low_y - t_high_y);

    // Active process highlight on T-S
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (currentStage === 0) {
      ctx.moveTo(s1, t_high_y);
      ctx.lineTo(s2, t_high_y);
    } else if (currentStage === 1) {
      ctx.moveTo(s2, t_high_y);
      ctx.lineTo(s2, t_low_y);
    } else if (currentStage === 2) {
      ctx.moveTo(s2, t_low_y);
      ctx.lineTo(s1, t_low_y);
    } else {
      ctx.moveTo(s1, t_low_y);
      ctx.lineTo(s1, t_high_y);
    }
    ctx.stroke();

    // Node labels on T-S
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`1 (${tHigh} K)`, s1 - 25, t_high_y - 6);
    ctx.fillText(`2 (${tHigh} K)`, s2 + 6, t_high_y - 6);
    ctx.fillText(`3 (${tLow} K)`, s2 + 6, t_low_y + 14);
    ctx.fillText(`4 (${tLow} K)`, s1 - 25, t_low_y + 14);

    // Current tracer on T-S
    let curTS_x = s1;
    let curTS_y = t_high_y;
    if (currentStage === 0) {
      curTS_x = s1 + (s2 - s1) * stageFraction;
      curTS_y = t_high_y;
    } else if (currentStage === 1) {
      curTS_x = s2;
      curTS_y = t_high_y + (t_low_y - t_high_y) * stageFraction;
    } else if (currentStage === 2) {
      curTS_x = s2 - (s2 - s1) * stageFraction;
      curTS_y = t_low_y;
    } else {
      curTS_x = s1;
      curTS_y = t_low_y - (t_low_y - t_high_y) * stageFraction;
    }

    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(curTS_x, curTS_y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Right: P-V Diagram (4 Synchronized Curves)
    const pvLeft = halfW + 30;
    const pvRight = width - 35;
    const pvBottom = height - 50;
    const pvTop = 45;
    const pvW = pvRight - pvLeft;
    const pvH = pvBottom - pvTop;

    // P-V Axes
    ctx.strokeStyle = ct.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pvLeft, pvTop);
    ctx.lineTo(pvLeft, pvBottom);
    ctx.lineTo(pvRight, pvBottom);
    ctx.stroke();

    ctx.fillStyle = ct.axisLabel;
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Pressure P (kPa)', pvLeft - 10, pvTop - 10);
    ctx.fillText('Volume V (m³) →', pvRight - 55, pvBottom + 25);
    ctx.fillText('P-V DIAGRAM (INDICATOR WORK LOOP)', pvLeft, 22);

    // 4 States on P-V
    const v1 = pvLeft + pvW * 0.15;
    const p1 = pvTop + pvH * 0.12;

    const v2 = pvLeft + pvW * 0.45;
    const p2 = pvTop + pvH * 0.35;

    const v3 = pvLeft + pvW * 0.88;
    const p3 = pvTop + pvH * 0.72;

    const v4 = pvLeft + pvW * 0.50;
    const p4 = pvTop + pvH * 0.88;

    // Draw P-V Closed Loop
    ctx.fillStyle = isLightTheme ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.12)';
    ctx.beginPath();
    ctx.moveTo(v1, p1);
    ctx.bezierCurveTo((v1 + v2) / 2, p1 + 10, v2 - 10, p2 - 5, v2, p2); // 1-2 Isothermal
    ctx.bezierCurveTo(v2 + 20, p2 + 25, v3 - 25, p3 - 10, v3, p3);     // 2-3 Adiabatic
    ctx.bezierCurveTo((v3 + v4) / 2, p3 + 10, v4 + 10, p4 - 5, v4, p4); // 3-4 Isothermal
    ctx.bezierCurveTo(v4 - 25, p4 - 25, v1 + 15, p1 + 25, v1, p1);     // 4-1 Adiabatic
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Active stage curve highlight on P-V
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (currentStage === 0) {
      ctx.moveTo(v1, p1);
      ctx.bezierCurveTo((v1 + v2) / 2, p1 + 10, v2 - 10, p2 - 5, v2, p2);
    } else if (currentStage === 1) {
      ctx.moveTo(v2, p2);
      ctx.bezierCurveTo(v2 + 20, p2 + 25, v3 - 25, p3 - 10, v3, p3);
    } else if (currentStage === 2) {
      ctx.moveTo(v3, p3);
      ctx.bezierCurveTo((v3 + v4) / 2, p3 + 10, v4 + 10, p4 - 5, v4, p4);
    } else {
      ctx.moveTo(v4, p4);
      ctx.bezierCurveTo(v4 - 25, p4 - 25, v1 + 15, p1 + 25, v1, p1);
    }
    ctx.stroke();

    // Node labels on P-V
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('1 (State 1)', v1 - 20, p1 - 6);
    ctx.fillText('2 (State 2)', v2 + 6, p2 - 6);
    ctx.fillText('3 (State 3)', v3 + 6, p3 + 12);
    ctx.fillText('4 (State 4)', v4 - 25, p4 + 12);

    // Current tracer point on P-V
    let curPV_x = v1;
    let curPV_y = p1;
    if (currentStage === 0) {
      curPV_x = v1 + (v2 - v1) * stageFraction;
      curPV_y = p1 + (p2 - p1) * stageFraction;
    } else if (currentStage === 1) {
      curPV_x = v2 + (v3 - v2) * stageFraction;
      curPV_y = p2 + (p3 - p2) * stageFraction;
    } else if (currentStage === 2) {
      curPV_x = v3 - (v3 - v4) * stageFraction;
      curPV_y = p3 + (p4 - p3) * stageFraction;
    } else {
      curPV_x = v4 - (v4 - v1) * stageFraction;
      curPV_y = p4 - (p4 - p1) * stageFraction;
    }

    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(curPV_x, curPV_y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [tHigh, tLow, currentStage, stageFraction, isDark]);

  return (
    <div ref={containerRef} className="space-y-4 md:space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30 shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[18px] md:text-[20px] font-bold text-slate-900 dark:text-white leading-[1.3]">
              Synchronized Carnot Cycle Simulator (P-V & T-S)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
              Four reversible processes: Isothermal expansion, Adiabatic expansion, Isothermal compression, Adiabatic compression.
            </p>
          </div>
        </div>

        {/* Play / Step / Reset Toolbar (Touch friendly >= 44px) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-100 dark:bg-slate-900 text-xs">
            <button
              onClick={() => setMode('engine')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'engine'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Heat Engine (<MathView math="\eta" />)
            </button>
            <button
              onClick={() => setMode('refrigerator')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'refrigerator'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Refrigerator (<MathView math="COP_R" />)
            </button>
            <button
              onClick={() => setMode('heatpump')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                mode === 'heatpump'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Heat Pump (<MathView math="COP_{HP}" />)
            </button>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            title={isPlaying ? 'Pause Cycle' : 'Play Cycle'}
            aria-label={isPlaying ? 'Pause Cycle' : 'Play Cycle'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-teal-500" />}
          </button>

          <button
            onClick={handleStepStage}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            title="Step to Next Process"
            aria-label="Step to Next Process"
          >
            <StepForward className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center justify-center"
            title="Reset to Standard Parameters"
            aria-label="Reset Parameters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stage Step Navigator Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stageDescriptions.map((stage, idx) => (
          <button
            key={idx}
            onClick={() => setStageDirect(idx)}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              currentStage === idx
                ? 'bg-teal-50 border-teal-500 dark:bg-teal-500/15 dark:border-teal-400 shadow-sm'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-teal-400/50'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
              <span className={currentStage === idx ? 'text-teal-700 dark:text-teal-300' : 'text-slate-500'}>
                STAGE {idx + 1}
              </span>
              {currentStage === idx && <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>}
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
              {stage.title.split(': ')[1]}
            </div>
          </button>
        ))}
      </div>

      {/* Presets Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-bold text-slate-600 dark:text-slate-400 font-mono text-[11px] flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-teal-500" />
          Cycle Presets:
        </span>
        <button
          onClick={() => applyPreset('power_plant')}
          className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Steam Power Plant (<MathView math="T_H=800\text{ K}, T_L=300\text{ K}" />)
        </button>
        <button
          onClick={() => applyPreset('cryo_ref')}
          className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Cryogenic Cooler (<MathView math="T_L=77\text{ K}" />)
        </button>
        <button
          onClick={() => applyPreset('heat_pump')}
          className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-teal-500 font-medium transition-all"
        >
          Heat Pump COP (<MathView math="COP_{HP} = COP_R + 1" />)
        </button>

        {/* Speed Selector */}
        <div className="ml-auto flex items-center gap-1 text-[11px] font-mono text-slate-500">
          <span>Cycle Speed:</span>
          {[0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={() => setAnimSpeed(s)}
              className={`px-1.5 py-0.5 rounded ${
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

      {/* Main Dual P-V and T-S Diagram Canvas */}
      <div className="bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={680}
          height={320}
          className="w-full max-w-[680px] h-auto rounded-xl shadow-inner"
        />
        <div className="text-[10px] text-slate-500 font-mono mt-2 text-center">
          Left: T-S Carnot Rectangle with Area = Net Work <MathView math="W_{\text{net}} = (T_H - T_L)\Delta S" /> | Right: Indicator P-V work loop
        </div>
      </div>

      {/* Active Stage Detail Banner */}
      <div className="p-4 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-500/20 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300 font-mono">
          <span>CURRENT STAGE: {stageDescriptions[currentStage].title}</span>
          <span>{stageDescriptions[currentStage].tempState}</span>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <MathText text={stageDescriptions[currentStage].desc} />
        </div>
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
          Energy Exchange: <strong className="text-slate-800 dark:text-slate-200">{stageDescriptions[currentStage].heatWork}</strong>
        </div>
      </div>

      {/* Sliders for TH, TL, Qin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Source Temp TH */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              Source Temp (<MathView math="T_H" />)
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              {tHigh} K ({(tHigh - 273.15).toFixed(0)} °C)
            </span>
          </div>
          <input
            type="range"
            min={tLow + 30}
            max="1000"
            step="10"
            value={tHigh}
            onChange={(e) => setTHigh(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="text-[10px] text-slate-500 font-mono">High-temperature thermal reservoir</div>
        </div>

        {/* Sink Temp TL */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-cyan-600 dark:text-cyan-400">
              Sink Temp (<MathView math="T_L" />)
            </span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
              {tLow} K ({(tLow - 273.15).toFixed(0)} °C)
            </span>
          </div>
          <input
            type="range"
            min="50"
            max={tHigh - 30}
            step="10"
            value={tLow}
            onChange={(e) => setTLow(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="text-[10px] text-slate-500 font-mono">Low-temperature heat rejection sink</div>
        </div>

        {/* Heat In Qin */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Heat Supplied (<MathView math="Q_{in}" />)
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{heatIn} kJ</span>
          </div>
          <input
            type="range"
            min="200"
            max="3000"
            step="50"
            value={heatIn}
            onChange={(e) => setHeatIn(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500"
          />
          <div className="text-[10px] text-slate-500 font-mono">Total thermal input per cycle</div>
        </div>
      </div>

      {/* Performance Summary Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Carnot Efficiency (<MathView math="\eta" />)</div>
          <div className="text-xl font-bold font-mono text-teal-600 dark:text-teal-400">
            {(efficiency * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-500 font-mono"><MathView math="\eta = 1 - T_L/T_H = W_{\text{net}}/Q_{\text{in}}" /></div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Net Work (<MathView math="W_{\text{net}}" />)</div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {workNet.toFixed(1)} kJ
          </div>
          <div className="text-[10px] text-slate-500 font-mono"><MathView math="W_{\text{net}} = Q_{\text{in}} - Q_{\text{out}}" /></div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Refrigerator COP</div>
          <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {copRef.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono"><MathView math="COP_R = \frac{T_L}{T_H - T_L}" /></div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Heat Pump COP</div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {copHP.toFixed(2)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span><MathView math="COP_{HP} = COP_R + 1" /></span>
          </div>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe="As the temperature difference $(T_H - T_L)$ increases, Carnot thermal efficiency increases and the area of the T-S work loop widens."
        reason="Carnot efficiency depends SOLELY on the absolute temperatures of the heat source and sink ($\eta = 1 - T_L/T_H$). It is completely independent of the working fluid used, whether it is ideal gas, steam, or refrigerant."
        takeaway="Remember the universal relationship: $COP_{HP} = COP_R + 1$. A heat pump is always more efficient than a refrigerator by exactly 1 because all electrical work converted into friction also heats the target space."
        governingEquation="\eta_{\text{Carnot}} = 1 - \frac{T_L}{T_H} = \frac{W_{\text{net}}}{Q_{\text{in}}} \quad \text{and} \quad COP_{HP} = COP_R + 1"
        stateValues={[
          { label: 'η', value: `${(efficiency * 100).toFixed(1)}%`, highlight: true },
          { label: 'W_net', value: `${workNet.toFixed(1)}`, unit: 'kJ' },
          { label: 'COP_R', value: `${copRef.toFixed(2)}` },
          { label: 'COP_HP', value: `${copHP.toFixed(2)}` },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Carnot Principles & Theoretical Upper Efficiency Limits"
        badge="SECOND LAW REVISION"
        explanation="The Carnot cycle is the most efficient possible thermodynamic cycle operating between two thermal reservoirs at constant temperatures $T_H$ and $T_L$. Consisting of two reversible isotherms and two reversible adiabatics, it provides the benchmark standard for all practical heat engines and heat pumps."
        equation="\eta_{\text{th,Carnot}} = 1 - \frac{T_L}{T_H} = \frac{W_{\text{net}}}{Q_{\text{in}}}"
        secondaryEquation="COP_R = \frac{T_L}{T_H - T_L}, \quad COP_{HP} = \frac{T_H}{T_H - T_L} \implies COP_{HP} = COP_R + 1"
        specialCases={[
          {
            label: 'Carnot Heat Engine Verification',
            condition: '\eta = 1 - \frac{T_L}{T_H} = \frac{W_{\text{net}}}{Q_{\text{in}}}',
            result: 'Carnot efficiency depends solely on absolute temperatures ($T_H, T_L$ in Kelvin). It is independent of working fluid properties.',
          },
          {
            label: 'Heat Pump vs Refrigerator Identity',
            condition: 'COP_{HP} = COP_R + 1',
            result: 'Because $Q_H = Q_L + W_{\text{net}}$, dividing by $W_{\text{net}}$ yields $\\frac{Q_H}{W} = \\frac{Q_L}{W} + 1$, verifying $COP_{HP} = COP_R + 1$ exactly.',
          },
          {
            label: 'Carnot Theorem 1',
            condition: '\eta_{\text{irreversible}} < \eta_{\text{reversible}}',
            result: 'No actual heat engine operating between two thermal reservoirs can be more efficient than a completely reversible Carnot engine.',
          },
          {
            label: 'Carnot Theorem 2',
            condition: '\eta_{\text{rev, A}} = \eta_{\text{rev, B}}',
            result: 'All reversible engines operating between the same two thermal reservoirs have the exact same efficiency, regardless of working substance.',
          },
        ]}
        symbols={[
          { symbol: '\eta', name: 'Carnot Thermal Efficiency', unit: 'Dimensionless [0 to 1]', description: 'Fraction of input heat successfully converted into useful work' },
          { symbol: 'T_H', name: 'Source Absolute Temperature', unit: 'Kelvin [K]', description: 'Temperature of the high-temperature heat supply reservoir' },
          { symbol: 'T_L', name: 'Sink Absolute Temperature', unit: 'Kelvin [K]', description: 'Temperature of the low-temperature heat rejection sink' },
          { symbol: 'W_{\\text{net}}', name: 'Net Work Output', unit: 'kJ', description: 'Total useful mechanical work produced per complete cycle' },
          { symbol: 'Q_{\\text{in}}', name: 'Heat Added (Q_H)', unit: 'kJ', description: 'Thermal energy supplied reversibly at source temperature T_H' },
          { symbol: 'COP', name: 'Coefficient of Performance', unit: 'Dimensionless [-]', description: 'Ratio of desired thermal effect to net work input required' },
        ]}
        takeaway="Temperatures $T_H$ and $T_L$ in cycle efficiency formulas must ALWAYS be expressed in absolute units (Kelvin). Efficiency can only approach 100% if $T_L \to 0\text{ K}$ or $T_H \to \infty$, both of which are physically impossible by the Third Law of Thermodynamics."
        validity="Applies to completely reversible cyclic heat engines, refrigerators, and heat pumps operating in quasi-static equilibrium with two infinite thermal capacity reservoirs."
        variant="emerald"
      />
    </div>
  );
};
