import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, Snowflake, Zap, RefreshCw, Gauge } from 'lucide-react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const CarnotCycleSim: React.FC = () => {
  const { isDark } = useTheme();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cycleTime, setCycleTime] = useState<number>(0); // 0 to 4
  const [tHigh, setTHigh] = useState<number>(600); // K
  const [tLow, setTLow] = useState<number>(300); // K
  const [heatIn, setHeatIn] = useState<number>(1000); // kJ
  const [mode, setMode] = useState<'engine' | 'refrigerator' | 'heatpump'>('engine');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Efficiency and COP calculations
  const efficiency = 1 - tLow / tHigh; // Carnot efficiency
  const workNet = heatIn * efficiency;
  const heatOut = heatIn - workNet;
  const copRef = tLow / (tHigh - tLow);
  const copHP = tHigh / (tHigh - tLow);

  // Animation ticker
  useEffect(() => {
    let animId: number;
    const speed = 0.008;

    const tick = () => {
      if (isPlaying) {
        setCycleTime((prev) => (prev + speed) % 4);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Current stage in 4-step cycle
  const currentStage = Math.floor(cycleTime); // 0: 1->2, 1: 2->3, 2: 3->4, 3: 4->1
  const stageFraction = cycleTime - currentStage;

  const stageDescriptions = [
    {
      name: 'Process 1-2: Reversible Isothermal Heat Addition',
      detail: `Heat Q_in is absorbed reversibly from High-Temp Reservoir (T_H = ${tHigh} K) at constant temperature. Gas expands reversibly doing boundary work.`,
      tempState: 'T = T_H (Const)',
      action: 'Heat Addition (+Q_H)',
    },
    {
      name: 'Process 2-3: Reversible Adiabatic Expansion',
      detail: `Gas continues expanding with perfect thermal insulation (Q = 0). Internal energy decreases to produce maximum work while temperature drops from T_H to T_L.`,
      tempState: `T drops from ${tHigh} K → ${tLow} K`,
      action: 'Adiabatic Work (+W)',
    },
    {
      name: 'Process 3-4: Reversible Isothermal Heat Rejection',
      detail: `Heat Q_out is rejected reversibly to Low-Temp Sink (T_L = ${tLow} K) at constant temperature while gas is compressed.`,
      tempState: 'T = T_L (Const)',
      action: 'Heat Rejection (-Q_L)',
    },
    {
      name: 'Process 4-1: Reversible Adiabatic Compression',
      detail: `Gas is compressed isentropically (Q = 0). Work is done ON the gas, raising its temperature back from T_L to T_H, completing the cycle.`,
      tempState: `T rises from ${tLow} K → ${tHigh} K`,
      action: 'Adiabatic Work Input (-W)',
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

    // Background
    ctx.fillStyle = ct.bg;
    ctx.fillRect(0, 0, width, height);

    // Layout: Left: T-S Diagram, Right: P-V Diagram
    const halfW = width / 2;

    // 1. Left: T-S Diagram
    const tsLeft = 45;
    const tsRight = halfW - 25;
    const tsBottom = height - 50;
    const tsTop = 45;
    const tsW = tsRight - tsLeft;
    const tsH = tsBottom - tsTop;

    // Draw T-S Axes
    ctx.strokeStyle = ct.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tsLeft, tsTop);
    ctx.lineTo(tsLeft, tsBottom);
    ctx.lineTo(tsRight, tsBottom);
    ctx.stroke();

    ctx.fillStyle = ct.axisLabel;
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Temperature (T)', tsLeft - 10, tsTop - 10);
    ctx.fillText('Entropy (S)', tsRight - 15, tsBottom + 25);
    ctx.fillText('T-S DIAGRAM (CARNOT RECTANGLE)', tsLeft, 22);

    // T-S Corners (Rectangle for Carnot!)
    const s1 = tsLeft + tsW * 0.25;
    const s2 = tsLeft + tsW * 0.8;
    const t_high_y = tsBottom - (tHigh / 800) * tsH;
    const t_low_y = tsBottom - (tLow / 800) * tsH;

    // Carnot Rectangle on T-S
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fillRect(s1, t_high_y, s2 - s1, t_low_y - t_high_y);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(s1, t_high_y, s2 - s1, t_low_y - t_high_y);

    // Arrow markers on T-S rectangle
    const drawArrow = (x1: number, y1: number, x2: number, y2: number) => {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx - 8 * Math.cos(angle - Math.PI / 6), my - 8 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(mx - 8 * Math.cos(angle + Math.PI / 6), my - 8 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    drawArrow(s1, t_high_y, s2, t_high_y); // 1->2
    drawArrow(s2, t_high_y, s2, t_low_y);  // 2->3
    drawArrow(s2, t_low_y, s1, t_low_y);   // 3->4
    drawArrow(s1, t_low_y, s1, t_high_y);  // 4->1

    // Node labels (1,2,3,4)
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('1 (T_H, S_1)', s1 - 25, t_high_y - 8);
    ctx.fillText('2 (T_H, S_2)', s2 + 6, t_high_y - 8);
    ctx.fillText('3 (T_L, S_2)', s2 + 6, t_low_y + 14);
    ctx.fillText('4 (T_L, S_1)', s1 - 25, t_low_y + 14);

    // Calculate current tracer point on T-S
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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(curTS_x, curTS_y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Right: P-V Diagram
    const pvLeft = halfW + 35;
    const pvRight = width - 35;
    const pvBottom = height - 50;
    const pvTop = 45;
    const pvW = pvRight - pvLeft;
    const pvH = pvBottom - pvTop;

    ctx.strokeStyle = ct.axis;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pvLeft, pvTop);
    ctx.lineTo(pvLeft, pvBottom);
    ctx.lineTo(pvRight, pvBottom);
    ctx.stroke();

    ctx.fillStyle = ct.axisLabel;
    ctx.fillText('Pressure (P)', pvLeft - 10, pvTop - 10);
    ctx.fillText('Volume (V)', pvRight - 15, pvBottom + 25);
    ctx.fillText('P-V INDICATOR DIAGRAM', pvLeft, 22);

    // 4 Corner points on P-V
    const pt1 = { x: pvLeft + pvW * 0.15, y: pvTop + pvH * 0.15 };
    const pt2 = { x: pvLeft + pvW * 0.50, y: pvTop + pvH * 0.38 };
    const pt3 = { x: pvLeft + pvW * 0.88, y: pvTop + pvH * 0.82 };
    const pt4 = { x: pvLeft + pvW * 0.38, y: pvTop + pvH * 0.62 };

    // Fill closed area
    ctx.fillStyle = ct.isLight ? 'rgba(16, 185, 129, 0.18)' : 'rgba(16, 185, 129, 0.12)';
    ctx.beginPath();
    ctx.moveTo(pt1.x, pt1.y);
    ctx.bezierCurveTo(pt1.x + 30, pt1.y + 15, pt2.x - 30, pt2.y - 15, pt2.x, pt2.y);
    ctx.bezierCurveTo(pt2.x + 40, pt2.y + 50, pt3.x - 30, pt3.y - 30, pt3.x, pt3.y);
    ctx.bezierCurveTo(pt3.x - 50, pt3.y - 15, pt4.x + 40, pt4.y + 15, pt4.x, pt4.y);
    ctx.bezierCurveTo(pt4.x - 30, pt4.y - 50, pt1.x + 20, pt1.y + 30, pt1.x, pt1.y);
    ctx.closePath();
    ctx.fill();

    // Stroke PV loop
    ctx.strokeStyle = ct.isLight ? '#059669' : '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Node labels on PV
    ctx.fillStyle = ct.textMain;
    ctx.fillText('1', pt1.x - 14, pt1.y - 4);
    ctx.fillText('2', pt2.x + 8, pt2.y - 6);
    ctx.fillText('3', pt3.x + 8, pt3.y + 8);
    ctx.fillText('4', pt4.x - 14, pt4.y + 14);

    // Calculate current tracer point on P-V
    let curPV_x = pt1.x;
    let curPV_y = pt1.y;
    if (currentStage === 0) {
      curPV_x = pt1.x + (pt2.x - pt1.x) * stageFraction;
      curPV_y = pt1.y + (pt2.y - pt1.y) * stageFraction;
    } else if (currentStage === 1) {
      curPV_x = pt2.x + (pt3.x - pt2.x) * stageFraction;
      curPV_y = pt2.y + (pt3.y - pt2.y) * stageFraction;
    } else if (currentStage === 2) {
      curPV_x = pt3.x + (pt4.x - pt3.x) * stageFraction;
      curPV_y = pt3.y + (pt4.y - pt3.y) * stageFraction;
    } else {
      curPV_x = pt4.x + (pt1.x - pt4.x) * stageFraction;
      curPV_y = pt4.y + (pt1.y - pt4.y) * stageFraction;
    }

    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(curPV_x, curPV_y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [tHigh, tLow, currentStage, stageFraction, isDark]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
      {/* Header & Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <RefreshCw className="w-5 h-5" />
          </span>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Reversible Carnot Cycle & Second Law Engine</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">Synchronized P-V and T-S state tracer, thermal efficiency, & reservoir interactions</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['engine', 'refrigerator', 'heatpump'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                mode === m
                  ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              {m === 'engine' ? 'Heat Engine' : m === 'refrigerator' ? 'Refrigerator' : 'Heat Pump'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Synchronized Canvas Viewport */}
      <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center items-center">
        <canvas ref={canvasRef} width={680} height={320} className="w-full max-w-3xl h-auto" />
      </div>

      {/* Active Phase Card */}
      <div className="bg-cyan-50/70 dark:bg-slate-950/80 border border-cyan-300 dark:border-cyan-500/30 rounded-xl p-3.5 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
            {stageDescriptions[currentStage].action}
          </span>
          <span className="text-xs font-mono text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded font-bold">
            {stageDescriptions[currentStage].tempState}
          </span>
        </div>
        <h5 className="text-sm font-bold text-slate-900 dark:text-white">{stageDescriptions[currentStage].name}</h5>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{stageDescriptions[currentStage].detail}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> High Temp (T_H)
          </span>
          <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">{tHigh} K</div>
          <span className="text-[10px] text-slate-500">{(tHigh - 273.15).toFixed(1)} °C</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
            <Snowflake className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Low Temp (T_L)
          </span>
          <div className="text-lg font-bold font-mono text-cyan-700 dark:text-cyan-400 mt-1">{tLow} K</div>
          <span className="text-[10px] text-slate-500">{(tLow - 273.15).toFixed(1)} °C</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            {mode === 'engine' ? 'Carnot Efficiency (η)' : mode === 'refrigerator' ? 'COP_Refrigerator' : 'COP_HeatPump'}
          </span>
          <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">
            {mode === 'engine' ? `${(efficiency * 100).toFixed(1)}%` : mode === 'refrigerator' ? copRef.toFixed(2) : copHP.toFixed(2)}
          </div>
          <span className="text-[10px] text-slate-500">
            {mode === 'engine' ? 'η_max = 1 - T_L/T_H' : mode === 'refrigerator' ? 'T_L / (T_H - T_L)' : 'T_H / (T_H - T_L)'}
          </span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Net Work (W_net)
          </span>
          <div className="text-lg font-bold font-mono text-amber-700 dark:text-amber-400 mt-1">{workNet.toFixed(1)} kJ</div>
          <span className="text-[10px] text-slate-500">Q_in: {heatIn} kJ | Q_out: {heatOut.toFixed(1)} kJ</span>
        </div>
      </div>

      {/* Temperature Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-800 dark:text-slate-300">Source Temperature (T_H):</span>
            <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">{tHigh} K</span>
          </div>
          <input
            type="range"
            min="450"
            max="1200"
            step="10"
            value={tHigh}
            onChange={(e) => setTHigh(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 border border-slate-300 dark:border-slate-600"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-800 dark:text-slate-300">Sink Temperature (T_L):</span>
            <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{tLow} K</span>
          </div>
          <input
            type="range"
            min="200"
            max="400"
            step="5"
            value={tLow}
            onChange={(e) => setTLow(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 border border-slate-300 dark:border-slate-600"
          />
        </div>
      </div>
    </div>
  );
};
