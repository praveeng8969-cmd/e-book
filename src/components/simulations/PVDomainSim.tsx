import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Gauge, TrendingUp, Sliders } from 'lucide-react';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

type ProcessType = 'isobaric' | 'isochoric' | 'isothermal' | 'adiabatic' | 'polytropic';

export const PVDomainSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);
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
      if (isPlaying && shouldAnimate) {
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
      if (shouldAnimate) {
        animId = requestAnimationFrame(tick);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, shouldAnimate]);

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
    <div ref={containerRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <h4 className="card-heading text-slate-900 dark:text-white">Interactive Gas Processes & P-V Indicator Tracer</h4>
              <p className="secondary-text text-slate-600 dark:text-slate-400">Real-time work integration (W = ∫ P dV), cylinder displacement, & process slopes</p>
            </div>
          </div>
        </div>

        {/* Process Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['isobaric', 'isochoric', 'isothermal', 'adiabatic', 'polytropic'] as ProcessType[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setProcessType(p);
                setProgress(0.5);
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all ${
                processType === p
                  ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-slate-950'
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
          <p className="secondary-text text-slate-600 dark:text-slate-400">
            Slope on P-V: <MathView math={slopeLatex} />
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Displacement Work Output (W)
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {workDone.toFixed(2)} <span className="text-xs text-slate-500 font-normal">kJ</span>
          </div>
          <p className="secondary-text text-slate-600 dark:text-slate-400">
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
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-300 shrink-0">Scrub State (Progress):</span>
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
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-emerald-500 touch-pan-y"
          />
          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 w-12 text-right">{(progress * 100).toFixed(0)}%</span>
        </div>

        {processType === 'polytropic' && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 font-mono font-semibold">n =</span>
            <input
              type="number"
              min="1.05"
              max="1.6"
              step="0.05"
              value={polytropicIndex}
              onChange={(e) => setPolytropicIndex(Number(e.target.value))}
              className="min-h-[40px] w-20 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white text-center"
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title={isPlaying ? 'Pause auto-cycle' : 'Play auto-cycle'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              setProgress(0);
              setIsPlaying(true);
            }}
            className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe="The shaded area beneath the process curve directly represents boundary displacement work. As the polytropic index n increases, the curve steepens, reducing work output for a given expansion ratio."
        reason="Because boundary work is defined as $W = \int P dV$, the path with the highest intermediate pressures produces the largest enclosed area on the P-V plane. Isobaric ($n=0$) yields the maximum work area, followed by isothermal ($n=1$), polytropic ($1 < n < \gamma$), and adiabatic ($n=\gamma$)."
        takeaway="Work is an area on the P-V coordinate diagram. Remember the Polytropic Work Formula: $W = \frac{P_1 V_1 - P_2 V_2}{n - 1} = \frac{m R (T_1 - T_2)}{n - 1}$ (for $n \neq 1$), and $W = P_1 V_1 \ln(V_2/V_1)$ when $n = 1$."
        governingEquation="W = \int_{V_1}^{V_2} P \, dV = \frac{P_1 V_1 - P_2 V_2}{n - 1} \quad (n \neq 1)"
        stateValues={[
          { label: 'Process', value: processType.toUpperCase() },
          { label: 'Work Area', value: `${workDone.toFixed(2)}`, unit: 'kJ', highlight: true },
          { label: 'Slope |dP/dV|', value: processType === 'isochoric' ? '∞' : processType === 'isobaric' ? '0' : 'n(P/V)' },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Polytropic Index & Work Integration ($W = \int P dV$)"
        badge="WORK INTEGRATION REVISION"
        explanation="In closed systems, quasi-static non-flow boundary work represents the physical displacement of the system boundary against resisting fluid pressure, geometrically corresponding to the projected area under the process path on P-V coordinates."
        equation="W_{1-2} = \int_{V_1}^{V_2} P \, dV = \begin{cases} \frac{P_1 V_1 - P_2 V_2}{n - 1} = \frac{m R (T_1 - T_2)}{n - 1}, & n \neq 1 \\[8pt] P_1 V_1 \ln\left(\frac{V_2}{V_1}\right), & n = 1 \end{cases}"
        secondaryEquation="PV^n = \text{Constant} \implies \left(\frac{\partial P}{\partial V}\right) = -n \frac{P}{V}"
        specialCases={[
          {
            label: 'Isobaric (n = 0)',
            condition: 'P = \text{const} \implies W = P(V_2 - V_1)',
            result: 'Horizontal line on P-V plane. Largest work area during expansion.',
          },
          {
            label: 'Isothermal (n = 1)',
            condition: 'T = \text{const} \implies W = P_1 V_1 \ln(V_2/V_1)',
            result: 'Rectangular hyperbola ($PV = \text{const}$). Work equals heat transfer for ideal gas.',
          },
          {
            label: 'Adiabatic (n = γ)',
            condition: 'Q = 0 \implies W = \frac{P_1 V_1 - P_2 V_2}{\gamma - 1}',
            result: 'Steeper than isothermal curve by factor of $\gamma = 1.4$. Work extracted from internal energy.',
          },
          {
            label: 'Isochoric (n = ∞)',
            condition: 'V = \text{const} \implies W = 0',
            result: 'Vertical line on P-V coordinates. Zero boundary work area.',
          },
        ]}
        symbols={[
          { symbol: 'W', name: 'Displacement Work', unit: 'kJ', description: 'Area under process curve on P-V diagram' },
          { symbol: 'n', name: 'Polytropic Index', unit: 'Dimensionless [-]', description: 'Exponent governing curve slope: 0 (isobaric) to ∞ (isochoric)' },
          { symbol: 'P', name: 'Pressure', unit: 'kPa', description: 'Fluid pressure acting against piston boundary' },
          { symbol: 'V', name: 'Volume', unit: 'm³', description: 'Enclosure volume bounded by piston face' },
        ]}
        takeaway="The slope of an adiabatic process curve on P-V coordinates is always $\gamma$ times steeper than that of an isothermal curve: $\left(\frac{\partial P}{\partial V}\right)_{\text{adiabatic}} = \gamma \left(\frac{\partial P}{\partial V}\right)_{\text{isothermal}}$."
        validity="Valid for reversible quasi-static processes of simple compressible substances following the polytropic relation $PV^n = \text{const}$."
        variant="emerald"
      />
    </div>
  );
};
