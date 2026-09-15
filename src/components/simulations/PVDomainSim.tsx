import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Gauge, TrendingUp, Sliders } from 'lucide-react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

type ProcessType = 'isobaric' | 'isochoric' | 'isothermal' | 'adiabatic' | 'polytropic';

export const PVDomainSim: React.FC = () => {
  const { isDark } = useTheme();
  const [processType, setProcessType] = useState<ProcessType>('isothermal');
  const [progress, setProgress] = useState<number>(0.5); // 0 (state 1) to 1 (state 2)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [direction, setDirection] = useState<'expansion' | 'compression'>('expansion');
  const [polytropicIndex, setPolytropicIndex] = useState<number>(1.25);
  const [gammaVal, setGammaVal] = useState<number>(1.4); // Air = 1.4
  const [initialP, setInitialP] = useState<number>(400); // kPa
  const [initialV, setInitialV] = useState<number>(0.1); // m^3
  const [volumeRatio, setVolumeRatio] = useState<number>(2.5); // V2/V1

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  // Auto animation scrubber
  useEffect(() => {
    let animId: number;
    let currentProgress = progress;
    let forward = true;

    const tick = () => {
      if (isPlaying) {
        if (forward) {
          currentProgress += 0.006;
          if (currentProgress >= 1) {
            currentProgress = 1;
            forward = false;
          }
        } else {
          currentProgress -= 0.006;
          if (currentProgress <= 0) {
            currentProgress = 0;
            forward = true;
          }
        }
        setProgress(currentProgress);
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Derived thermodynamic states
  const P1 = initialP;
  const V1 = initialV;
  const V2 = initialV * volumeRatio;

  // Current volume based on progress
  const currentV = V1 + (V2 - V1) * progress;

  // Calculate current P according to selected process
  let currentP = P1;
  let workDone = 0; // kJ
  let processFormula = '';
  let slopeLatex = '';

  switch (processType) {
    case 'isobaric': // P = const (k = 0)
      currentP = P1;
      workDone = P1 * (currentV - V1);
      processFormula = 'P = \\text{Constant} \\quad (k = 0)';
      slopeLatex = '\\left(\\frac{dP}{dV}\\right) = 0';
      break;
    case 'isochoric': // V = const (k = infinity)
      currentP = P1 * (1 + (progress - 0.5) * 1.5);
      workDone = 0;
      processFormula = 'V = \\text{Constant} \\quad (k = \\infty)';
      slopeLatex = '\\left(\\frac{dP}{dV}\\right) = \\infty';
      break;
    case 'isothermal': // PV = C (k = 1)
      currentP = (P1 * V1) / currentV;
      workDone = P1 * V1 * Math.log(currentV / V1);
      processFormula = 'PV = C \\quad (k = 1, T = \\text{Const})';
      slopeLatex = '\\left(\\frac{dP}{dV}\\right) = -\\frac{P}{V}';
      break;
    case 'adiabatic': // PV^gamma = C (k = gamma)
      currentP = P1 * Math.pow(V1 / currentV, gammaVal);
      const P2_ad = P1 * Math.pow(V1 / currentV, gammaVal);
      workDone = (P1 * V1 - P2_ad * currentV) / (gammaVal - 1);
      processFormula = `PV^{\\gamma} = C \\quad (k = ${gammaVal}, Q = 0)`;
      slopeLatex = '\\left(\\frac{dP}{dV}\\right) = -\\gamma \\frac{P}{V}';
      break;
    case 'polytropic': // PV^n = C (k = n)
      currentP = P1 * Math.pow(V1 / currentV, polytropicIndex);
      const P2_poly = P1 * Math.pow(V1 / currentV, polytropicIndex);
      workDone = (P1 * V1 - P2_poly * currentV) / (polytropicIndex - 1);
      processFormula = `PV^{n} = C \\quad (n = ${polytropicIndex})`;
      slopeLatex = '\\left(\\frac{dP}{dV}\\right) = -n \\frac{P}{V}';
      break;
  }

  // Draw P-V Diagram and Piston Cylinder side by side
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

    // Left Viewport: Piston Cylinder Animation (0 to width * 0.45)
    const leftWidth = width * 0.42;
    const pLeft = 40;
    const pRight = leftWidth - 30;
    const pBottom = height - 45;
    const pTop = 45;
    const pHeight = pBottom - pTop;

    // Cylinder outline
    ctx.strokeStyle = ct.containerBorder;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(pLeft, pTop);
    ctx.lineTo(pLeft, pBottom);
    ctx.lineTo(pRight, pBottom);
    ctx.lineTo(pRight, pTop);
    ctx.stroke();

    // Piston position based on current volume
    const normVol = processType === 'isochoric' ? 0.5 : (currentV - V1) / (V2 - V1);
    const pistonY = pBottom - 40 - normVol * (pHeight - 80);

    // Gas Chamber Fill (color changes with pressure/temp)
    const tempIntensity = Math.min(255, Math.floor(100 + (currentP / 600) * 150));
    ctx.fillStyle = ct.isLight
      ? `rgba(${tempIntensity}, 120, 240, 0.15)`
      : `rgba(${tempIntensity}, 90, 220, 0.15)`;
    ctx.fillRect(pLeft + 3, pistonY + 12, pRight - pLeft - 6, pBottom - pistonY - 12);

    // Draw bouncy gas molecules inside cylinder
    ctx.fillStyle = ct.primary;
    const seed = 42;
    for (let i = 0; i < 20; i++) {
      const px = pLeft + 15 + ((i * 37 + (Date.now() * 0.05 * (currentP / 150))) % (pRight - pLeft - 30));
      const py = pistonY + 20 + ((i * 53 + (Date.now() * 0.08 * (currentP / 150))) % (pBottom - pistonY - 30));
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Piston Head
    ctx.fillStyle = ct.isLight ? '#cbd5e1' : '#334155';
    ctx.strokeStyle = ct.isLight ? '#94a3b8' : '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.fillRect(pLeft + 3, pistonY - 12, pRight - pLeft - 6, 24);
    ctx.strokeRect(pLeft + 3, pistonY - 12, pRight - pLeft - 6, 24);

    // Piston Shaft
    ctx.fillStyle = ct.isLight ? '#94a3b8' : '#64748b';
    ctx.fillRect((pLeft + pRight) / 2 - 8, pistonY - 60, 16, 48);

    // Labels on Left
    ctx.fillStyle = ct.textMuted;
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('CYLINDER DISPLACEMENT', pLeft, 25);
    ctx.fillStyle = ct.primary;
    ctx.fillText(`P = ${currentP.toFixed(1)} kPa`, pLeft, pBottom + 25);
    ctx.fillStyle = ct.warning;
    ctx.fillText(`V = ${currentV.toFixed(3)} m³`, (pLeft + pRight) / 2 - 10, pBottom + 25);

    // Right Viewport: P-V Indicator Diagram (width * 0.45 to width)
    const pvLeft = width * 0.48;
    const pvRight = width - 35;
    const pvBottom = height - 55;
    const pvTop = 45;
    const pvW = pvRight - pvLeft;
    const pvH = pvBottom - pvTop;

    // P-V Axes
    ctx.strokeStyle = ct.axis;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pvLeft, pvTop);
    ctx.lineTo(pvLeft, pvBottom);
    ctx.lineTo(pvRight, pvBottom);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = ct.axisLabel;
    ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
    ctx.fillText('Pressure (P)', pvLeft - 10, pvTop - 12);
    ctx.fillText('Volume (V)', pvRight - 20, pvBottom + 24);

    // Scaling helpers
    const maxP = 600;
    const maxV = V2 * 1.2;
    const vToX = (v: number) => pvLeft + (v / maxV) * pvW;
    const pToY = (p: number) => pvBottom - (p / maxP) * pvH;

    // Draw reference process lines for comparison
    const processes: ProcessType[] = ['isobaric', 'isothermal', 'adiabatic', 'polytropic'];
    const colors: Record<ProcessType, string> = {
      isobaric: '#10b981',
      isochoric: '#6366f1',
      isothermal: '#06b6d4',
      adiabatic: '#f97316',
      polytropic: '#ec4899',
    };

    // Draw Shaded Work Area under active curve: \int P dV
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.moveTo(vToX(V1), pvBottom);
    for (let t = 0; t <= progress; t += 0.02) {
      const v_t = V1 + (V2 - V1) * t;
      let p_t = P1;
      if (processType === 'isobaric') p_t = P1;
      else if (processType === 'isothermal') p_t = (P1 * V1) / v_t;
      else if (processType === 'adiabatic') p_t = P1 * Math.pow(V1 / v_t, gammaVal);
      else if (processType === 'polytropic') p_t = P1 * Math.pow(V1 / v_t, polytropicIndex);
      else if (processType === 'isochoric') p_t = P1 * (1 + (t - 0.5) * 1.5);
      ctx.lineTo(vToX(v_t), pToY(p_t));
    }
    ctx.lineTo(vToX(currentV), pvBottom);
    ctx.closePath();
    ctx.fill();

    // Draw full curve of active process
    ctx.strokeStyle = colors[processType];
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for (let t = 0; t <= 1.0; t += 0.02) {
      const v_t = V1 + (V2 - V1) * t;
      let p_t = P1;
      if (processType === 'isobaric') p_t = P1;
      else if (processType === 'isothermal') p_t = (P1 * V1) / v_t;
      else if (processType === 'adiabatic') p_t = P1 * Math.pow(V1 / v_t, gammaVal);
      else if (processType === 'polytropic') p_t = P1 * Math.pow(V1 / v_t, polytropicIndex);
      else if (processType === 'isochoric') p_t = P1 * (1 + (t - 0.5) * 1.5);

      if (t === 0) ctx.moveTo(vToX(v_t), pToY(p_t));
      else ctx.lineTo(vToX(v_t), pToY(p_t));
    }
    ctx.stroke();

    // Active Tracer Point on P-V
    const curX = vToX(currentV);
    const curY = pToY(currentP);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = colors[processType];
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(curX, curY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Project coordinates onto axes (dashed)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(curX, curY);
    ctx.lineTo(curX, pvBottom);
    ctx.moveTo(curX, curY);
    ctx.lineTo(pvLeft, curY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Indicator Diagram label
    ctx.fillStyle = ct.textMain;
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`P-V INDICATOR DIAGRAM (${processType.toUpperCase()})`, pvLeft, 25);
  }, [processType, progress, currentV, currentP, P1, V1, V2, gammaVal, polytropicIndex, isDark]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-xl space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Interactive Gas Processes & P-V Indicator Tracer</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">Real-time work integration (W = ∫ P dV), cylinder displacement, & process slopes</p>
            </div>
          </div>
        </div>

        {/* Process Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['isobaric', 'isochoric', 'isothermal', 'adiabatic', 'polytropic'] as ProcessType[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProcessType(p);
                setProgress(0.5);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                processType === p
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center items-center">
        <canvas ref={canvasRef} width={680} height={340} className="w-full max-w-3xl h-auto" />
      </div>

      {/* Dynamic Equation and Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Governing Process Law
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white py-1">
            <MathView math={processFormula} />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Slope on P-V: <MathView math={slopeLatex} />
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Displacement Work Output (W)
          </span>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {workDone.toFixed(2)} <span className="text-xs text-slate-500 font-normal">kJ</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Area under P-V curve projected onto volume axis
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
            Slope Comparison (<MathView math="|dP/dV|" />)
          </span>
          <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1 font-medium">
            <div className="flex justify-between">
              <span>Isochoric (<MathView math="k=\infty" />):</span> <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">Vertical (∞)</span>
            </div>
            <div className="flex justify-between">
              <span>Adiabatic (<MathView math="k=\gamma" />):</span> <span className="font-mono text-orange-600 dark:text-orange-400 font-bold">Steeper (γ × Isothermal)</span>
            </div>
            <div className="flex justify-between">
              <span>Isobaric (<MathView math="k=0" />):</span> <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Horizontal (0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-300 shrink-0">Scrub State (Progress):</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => {
              setIsPlaying(false);
              setProgress(Number(e.target.value));
            }}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 border border-slate-300 dark:border-slate-600"
          />
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 w-12 text-right">{(progress * 100).toFixed(0)}%</span>
        </div>

        {processType === 'polytropic' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">n =</span>
            <input
              type="number"
              min="1.05"
              max="1.6"
              step="0.05"
              value={polytropicIndex}
              onChange={(e) => setPolytropicIndex(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-900 dark:text-white text-center"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title={isPlaying ? 'Pause auto-cycle' : 'Play auto-cycle'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
