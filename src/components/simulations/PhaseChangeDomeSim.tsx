import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Layers, Droplet, Sun, Play, Pause, RotateCcw, Thermometer, Database, MousePointer, Activity } from 'lucide-react';
import { MathView } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';

export const PhaseChangeDomeSim: React.FC = () => {
  const { isDark } = useTheme();

  // State point in T-v space:
  // Temperature T in °C (20°C to 450°C)
  // Specific Volume v in m^3/kg (logarithmic scale: 0.001 to 2.0 m^3/kg)
  const [tempC, setTempC] = useState<number>(180); // °C
  const [specVol, setSpecVol] = useState<number>(0.05); // m^3/kg
  const [pressureBar, setPressureBar] = useState<number>(10); // bar
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Saturation temperature calculation for Water: Tsat ~ 99.6 + 36.5 * ln(P/1)
  const tSatC = useMemo(() => {
    return Math.round((99.6 + 36.5 * Math.log(pressureBar)) * 10) / 10;
  }, [pressureBar]);

  const tSatK = tSatC + 273.15;

  // Saturated liquid vf and saturated vapor vg at current Tsat
  const vf = 0.00104; // m^3/kg (approx constant for subcooled/sat liquid)
  const vg = useMemo(() => {
    return Math.max(0.005, (0.4615 * tSatK) / (pressureBar * 100)); // m^3/kg
  }, [tSatK, pressureBar]);

  // Phase Determination & Quality Calculation
  const { regionName, qualityX, stateColor } = useMemo(() => {
    if (tempC > 374 || pressureBar > 220.6) {
      return {
        regionName: 'Supercritical Fluid (Above Critical Point T_c=374°C, P_c=220.6 bar)',
        qualityX: null,
        stateColor: '#a855f7', // Purple
      };
    }

    if (tempC < tSatC - 1) {
      return {
        regionName: 'Subcooled / Compressed Liquid',
        qualityX: 0,
        stateColor: '#0284c7', // Sky Blue
      };
    } else if (tempC > tSatC + 1) {
      return {
        regionName: 'Superheated Vapor',
        qualityX: 1,
        stateColor: '#f97316', // Orange
      };
    } else {
      // On saturation temperature line: check specVol
      if (specVol <= vf * 1.05) {
        return {
          regionName: 'Saturated Liquid (x = 0)',
          qualityX: 0,
          stateColor: '#06b6d4', // Cyan
        };
      } else if (specVol >= vg * 0.95) {
        return {
          regionName: 'Saturated Vapor (x = 1.0)',
          qualityX: 1.0,
          stateColor: '#e11d48', // Rose
        };
      } else {
        const x = Math.min(1, Math.max(0, (specVol - vf) / (vg - vf)));
        return {
          regionName: `Wet Saturated Mixture (Liquid + Vapor, Quality x = ${(x * 100).toFixed(1)}%)`,
          qualityX: Math.round(x * 1000) / 1000,
          stateColor: '#10b981', // Emerald
        };
      }
    }
  }, [tempC, tSatC, pressureBar, specVol, vf, vg]);

  // Handle Dragging / Clicking on Canvas
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;

    // T-v Chart coordinate boundaries
    const chartLeft = width * 0.40;
    const chartRight = width - 30;
    const chartTop = 40;
    const chartBottom = height - 45;

    if (x >= chartLeft && x <= chartRight && y >= chartTop && y <= chartBottom) {
      // Map y to Temperature (450°C at top, 0°C at bottom)
      const fracY = 1 - (y - chartTop) / (chartBottom - chartTop);
      const newT = Math.round(fracY * 450);
      setTempC(Math.min(450, Math.max(20, newT)));

      // Map x to log(specVol) (0.001 to 2.0 m^3/kg)
      const fracX = (x - chartLeft) / (chartRight - chartLeft);
      const logMin = Math.log10(0.001);
      const logMax = Math.log10(2.0);
      const newV = Math.pow(10, logMin + fracX * (logMax - logMin));
      setSpecVol(Math.round(newV * 10000) / 10000);
    }
  };

  // Canvas Drawing of Phase Dome and State Point
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;

    const isLightTheme = !isDark;
    const bg = isLightTheme ? '#f8fafc' : '#090d16';

    // Background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Left Viewport: Piston Cylinder Phase Chamber
    const pLeft = 30;
    const pRight = width * 0.35;
    const pBottom = height - 40;
    const pTop = 45;
    const pW = pRight - pLeft;
    const pH = pBottom - pTop;

    // Cylinder casing
    ctx.strokeStyle = isLightTheme ? '#334155' : '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pLeft, pTop);
    ctx.lineTo(pLeft, pBottom);
    ctx.lineTo(pRight, pBottom);
    ctx.lineTo(pRight, pTop);
    ctx.stroke();

    // Liquid vs Vapor split inside cylinder
    const xVal = qualityX !== null ? qualityX : (tempC > 374 ? 1 : 0);
    const liquidH = (1 - xVal) * (pH - 40);
    const vaporH = xVal * (pH - 40);

    // Liquid Region
    if (liquidH > 2) {
      ctx.fillStyle = isLightTheme ? '#38bdf8' : '#0284c7';
      ctx.fillRect(pLeft + 3, pBottom - liquidH, pW - 6, liquidH);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      if (liquidH > 20) {
        ctx.fillText(`Liquid: ${((1 - xVal) * 100).toFixed(0)}%`, pLeft + 12, pBottom - liquidH / 2 + 4);
      }
    }

    // Vapor Region
    if (vaporH > 2) {
      ctx.fillStyle = isLightTheme ? 'rgba(251, 146, 60, 0.25)' : 'rgba(234, 88, 12, 0.35)';
      ctx.fillRect(pLeft + 3, pBottom - liquidH - vaporH, pW - 6, vaporH);
      ctx.fillStyle = isLightTheme ? '#c2410c' : '#fdba74';
      ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
      if (vaporH > 20) {
        ctx.fillText(`Vapor: ${(xVal * 100).toFixed(0)}%`, pLeft + 12, pBottom - liquidH - vaporH / 2 + 4);
      }
    }

    // Piston Head
    const pistonY = pBottom - liquidH - vaporH;
    ctx.fillStyle = isLightTheme ? '#475569' : '#64748b';
    ctx.fillRect(pLeft + 2, pistonY - 10, pW - 4, 12);

    // Label Chamber
    ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('H₂O Phase Cell', pLeft + 10, pTop - 15);

    // Right Viewport: T-v Phase Dome Chart
    const chartLeft = width * 0.40;
    const chartRight = width - 30;
    const chartTop = 40;
    const chartBottom = height - 45;
    const chartW = chartRight - chartLeft;
    const chartH = chartBottom - chartTop;

    // Coordinate Converters: T -> Y, log(v) -> X
    const toY = (t: number) => chartBottom - (t / 450) * chartH;
    const logMin = Math.log10(0.001);
    const logMax = Math.log10(2.0);
    const toX = (v: number) => {
      const logV = Math.log10(Math.max(0.001, v));
      return chartLeft + ((logV - logMin) / (logMax - logMin)) * chartW;
    };

    // Draw Axes
    ctx.strokeStyle = isLightTheme ? '#94a3b8' : '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = isLightTheme ? '#475569' : '#94a3b8';
    ctx.font = '10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('T (°C)', chartLeft - 10, chartTop - 10);
    ctx.fillText('v (m³/kg, log scale) →', chartRight - 80, chartBottom + 20);

    // Draw Phase Dome (Liquid saturation curve + Vapor saturation curve)
    ctx.beginPath();
    // Critical Point (Tc = 374°C, vc = 0.00315 m^3/kg)
    const critX = toX(0.00315);
    const critY = toY(374);

    // Saturated Liquid line (left dome leg)
    ctx.moveTo(toX(0.001), toY(20));
    ctx.quadraticCurveTo(toX(0.00104), toY(250), critX, critY);

    // Saturated Vapor line (right dome leg)
    ctx.quadraticCurveTo(toX(0.05), toY(250), toX(1.67), toY(100));
    ctx.lineTo(toX(2.0), toY(20));

    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Fill Wet Vapor Zone under dome
    ctx.lineTo(toX(0.001), toY(20));
    ctx.fillStyle = isLightTheme ? 'rgba(20, 184, 166, 0.08)' : 'rgba(20, 184, 166, 0.12)';
    ctx.fill();

    // Critical Point Marker - Enhanced
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(critX, critY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('C (374°C, 221.2 bar)', critX + 10, critY - 4);
    ctx.font = '9px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = isLightTheme ? '#7c3aed' : '#c4b5fd';
    ctx.fillText('h_fg = 0 at C', critX + 10, critY + 10);

    // Region Labels on the T-v Chart
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    // Subcooled Liquid region (left of dome)
    ctx.fillStyle = isLightTheme ? '#0369a1' : '#7dd3fc';
    ctx.fillText('SUBCOOLED', toX(0.0012), toY(200));
    ctx.fillText('LIQUID', toX(0.0012), toY(180));
    // Wet Mixture region (under dome)
    ctx.fillStyle = isLightTheme ? '#0d9488' : '#5eead4';
    ctx.fillText('WET MIXTURE', toX(0.01), toY(180));
    ctx.font = '9px Plus Jakarta Sans, sans-serif';
    ctx.fillText('(0 < x < 1)', toX(0.012), toY(160));
    // Superheated Vapor region (right of dome)
    ctx.fillStyle = isLightTheme ? '#c2410c' : '#fdba74';
    ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
    ctx.fillText('SUPERHEATED', toX(0.25), toY(320));
    ctx.fillText('VAPOR', toX(0.30), toY(300));
    // Saturated liquid and vapor curve labels
    ctx.font = '9px Plus Jakarta Sans, sans-serif';
    ctx.fillStyle = isLightTheme ? '#115e59' : '#99f6e4';
    ctx.fillText('f-line (x=0)', toX(0.0008), toY(120));
    ctx.fillText('g-line (x=1)', toX(0.4), toY(120));

    // Draw Isobaric Line (Constant Pressure Line)
    ctx.strokeStyle = isLightTheme ? '#f59e0b' : '#fbbf24';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    const pY = toY(tSatC);
    const satVfX = toX(vf);
    const satVgX = toX(vg);

    ctx.beginPath();
    // Subcooled liquid slope
    ctx.moveTo(toX(0.001), toY(20));
    ctx.lineTo(satVfX, pY);
    // Constant Tsat horizontal boiling plateau
    ctx.lineTo(satVgX, pY);
    // Superheated vapor upward curve
    ctx.lineTo(toX(1.5), toY(Math.min(420, tSatC + 180)));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = isLightTheme ? '#b45309' : '#fcd34d';
    ctx.font = 'bold 9px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`P = ${pressureBar} bar (T_sat = ${tSatC}°C)`, satVfX + 5, pY - 6);

    // Draw Current State Point
    const stateX = toX(specVol);
    const stateY = toY(tempC);

    ctx.fillStyle = stateColor;
    ctx.beginPath();
    ctx.arc(stateX, stateY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // State Point Label
    ctx.fillStyle = isLightTheme ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText(`(${tempC}°C, ${specVol.toFixed(4)} m³/kg)`, Math.min(chartRight - 100, stateX + 10), stateY - 8);

    // Interactive Drag Hint
    ctx.fillStyle = isLightTheme ? '#64748b' : '#94a3b8';
    ctx.font = 'italic 10px Plus Jakarta Sans, sans-serif';
    ctx.fillText('💡 Click or Drag anywhere on chart to reposition state point', chartLeft + 10, chartBottom + 35);
  }, [tempC, specVol, pressureBar, tSatC, vf, vg, qualityX, stateColor, isDark]);

  return (
    <div className="space-y-6">
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Water Phase Dome Lab: $T-v$ Diagram & Vapor Quality ($x$)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Interactive draggable state point: Subcooled Liquid, Saturated Mixture (0 &lt; x &lt; 1), and Superheated Vapor.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setPressureBar(10);
            setTempC(180);
            setSpecVol(0.05);
          }}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Reset State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Interactive Canvas */}
      <div className="bg-slate-100/70 dark:bg-slate-950/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={680}
          height={320}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleCanvasInteraction(e);
          }}
          onMouseMove={(e) => {
            if (isDragging) handleCanvasInteraction(e);
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className="w-full max-w-[680px] h-[320px] rounded-xl shadow-inner cursor-crosshair"
        />
      </div>

      {/* Sliders for Pressure, Temperature, Spec Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pressure Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-amber-600 dark:text-amber-400">Pressure ($P$)</span>
            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
              {pressureBar} bar ($T_{'{'}sat{'}'} = {tSatC}°C$)
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="150"
            step="1"
            value={pressureBar}
            onChange={(e) => setPressureBar(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>1 bar (100°C)</span>
            <span>150 bar (342°C)</span>
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-rose-600 dark:text-rose-400">Temperature ($T$)</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{tempC} °C</span>
          </div>
          <input
            type="range"
            min="20"
            max="450"
            step="5"
            value={tempC}
            onChange={(e) => setTempC(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>20°C (Subcooled)</span>
            <span>450°C (Superheated)</span>
          </div>
        </div>

        {/* Specific Volume Slider */}
        <div className="bg-white/80 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-teal-600 dark:text-teal-400">Specific Volume ($v$)</span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">{specVol.toFixed(4)} m³/kg</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.5"
            step="0.005"
            value={specVol}
            onChange={(e) => setSpecVol(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <span>0.001 m³/kg (Liquid)</span>
            <span>0.5 m³/kg (Vapor)</span>
          </div>
        </div>
      </div>

      {/* Identified State Banner & Readouts */}
      <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Identified Thermodynamic Phase State
          </div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
            {regionName}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400">Dryness Fraction $x$: </span>
            <span className="font-bold text-teal-600 dark:text-teal-400">
              {qualityX !== null ? qualityX : 'N/A'}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-slate-600 dark:text-slate-400">Enthalpy $h$: </span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {(4.187 * tempC + (qualityX || 0) * 2200).toFixed(1)} kJ/kg
            </span>
          </div>
        </div>
      </div>

      {/* Key Takeaway Box */}
      <div className="bg-teal-50/70 dark:bg-teal-500/5 border border-teal-200 dark:border-teal-500/20 rounded-xl p-3.5">
        <h5 className="text-xs font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider mb-1.5">📝 Key Revision Takeaways</h5>
        <ul className="text-xs text-teal-900 dark:text-teal-300 space-y-1 leading-relaxed">
          <li>• During boiling (wet region), both T and P remain <strong>constant</strong> — all heat goes into latent heat h_fg</li>
          <li>• Quality x = m_vapor / m_total. Use x to interpolate: v = v_f + x·v_fg, h = h_f + x·h_fg</li>
          <li>• At the <strong>Critical Point</strong> (374°C, 221.2 bar): h_fg = 0, liquid transforms directly to vapor</li>
          <li>• <strong>State ID</strong>: Compare T with T_sat (or v with v_f, v_g) to identify subcooled / wet / superheated</li>
        </ul>
      </div>
    </div>
  );
};
