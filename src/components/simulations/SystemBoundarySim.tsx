import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Flame, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

export const SystemBoundarySim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);
  const [systemType, setSystemType] = useState<'closed' | 'open' | 'isolated'>('closed');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [heatInput, setHeatInput] = useState<number>(50); // 0 to 100
  const [pistonPosition, setPistonPosition] = useState<number>(0.5); // 0.2 to 0.8
  const [temperature, setTemperature] = useState<number>(300); // Kelvin
  const [massCount, setMassCount] = useState<number>(24);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particles simulation
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; radius: number; color: string }>>([]);

  useEffect(() => {
    // Initialize particles
    const particles = [];
    const count = systemType === 'open' ? 32 : 24;
    setMassCount(count);
    for (let i = 0; i < count; i++) {
      particles.push({
        x: 50 + Math.random() * 200,
        y: 60 + Math.random() * 120,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        radius: 4,
        color: '#38bdf8',
      });
    }
    particlesRef.current = particles;
  }, [systemType]);

  // Adjust temperature and piston position based on heatInput
  useEffect(() => {
    const calculatedTemp = 300 + (heatInput * 3.5);
    setTemperature(Math.round(calculatedTemp));
    if (systemType === 'closed') {
      setPistonPosition(0.35 + (heatInput / 100) * 0.45);
    } else {
      setPistonPosition(0.5);
    }
  }, [heatInput, systemType]);

  // Animation Loop
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      // Speed multiplier based on temperature
      const speedFactor = Math.sqrt(temperature / 300);

      // Boundaries definition
      const left = 60;
      const right = width - 60;
      const bottom = height - 50;
      const top = systemType === 'closed' ? bottom - (pistonPosition * (bottom - 40)) : 50;

      const ct = getCanvasTheme();

      // Draw surroundings background
      ctx.fillStyle = ct.bg;
      ctx.fillRect(0, 0, width, height);

      // Draw Chamber Box
      if (systemType === 'isolated') {
        // Thick vacuum insulation boundary
        ctx.strokeStyle = ct.warning;
        ctx.lineWidth = 14;
        ctx.strokeRect(left - 7, top - 7, right - left + 14, bottom - top + 14);
        ctx.fillStyle = ct.isLight ? '#fef3c7' : '#1e1b4b';
        ctx.fillRect(left, top, right - left, bottom - top);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);
      } else if (systemType === 'closed') {
        // Rigid side & bottom walls
        ctx.fillStyle = ct.chamberBg;
        ctx.fillRect(left, top, right - left, bottom - top);

        // Cylinder walls
        ctx.strokeStyle = ct.containerBorder;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(left, 30);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, 30);
        ctx.stroke();

        // Movable Piston Head
        ctx.fillStyle = ct.isLight ? '#cbd5e1' : '#334155';
        ctx.strokeStyle = ct.isLight ? '#94a3b8' : '#94a3b8';
        ctx.lineWidth = 3;
        ctx.fillRect(left + 2, top - 16, right - left - 4, 16);
        ctx.strokeRect(left + 2, top - 16, right - left - 4, 16);

        // Piston Rod
        ctx.fillStyle = ct.isLight ? '#94a3b8' : '#64748b';
        ctx.fillRect(width / 2 - 8, top - 60, 16, 44);

        // Work output arrow if expanding
        if (heatInput > 50) {
          ctx.strokeStyle = ct.success;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(width / 2, top - 65);
          ctx.lineTo(width / 2, top - 90);
          ctx.lineTo(width / 2 - 6, top - 82);
          ctx.moveTo(width / 2, top - 90);
          ctx.lineTo(width / 2 + 6, top - 82);
          ctx.stroke();
          ctx.fillStyle = ct.success;
          ctx.font = '11px Plus Jakarta Sans, sans-serif';
          ctx.fillText('+W (Boundary Work)', width / 2 + 12, top - 75);
        }
      } else {
        // Open System (Control Volume Pipe / Vessel with Inflow & Outflow)
        ctx.fillStyle = ct.chamberBg;
        ctx.fillRect(left, top, right - left, bottom - top);

        // Pipe entry & exit
        ctx.strokeStyle = ct.containerBorder;
        ctx.lineWidth = 6;
        // Upper wall with inlet opening
        ctx.beginPath();
        ctx.moveTo(10, top + 30);
        ctx.lineTo(left, top + 30);
        ctx.lineTo(left, top);
        ctx.lineTo(right, top);
        ctx.lineTo(right, bottom - 30);
        ctx.lineTo(width - 10, bottom - 30);
        ctx.stroke();

        // Lower wall
        ctx.beginPath();
        ctx.moveTo(10, top + 70);
        ctx.lineTo(left, top + 70);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, bottom + 10);
        ctx.lineTo(width - 10, bottom + 10);
        ctx.stroke();

        // Dashed Control Volume Boundary
        ctx.strokeStyle = ct.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(left, top, right - left, bottom - top);
        ctx.setLineDash([]);

        // Inflow / Outflow mass indicators
        ctx.fillStyle = ct.primary;
        ctx.font = '12px Plus Jakarta Sans, sans-serif';
        ctx.fillText('ṁ_in (Mass In)', 15, top + 20);
        ctx.fillText('ṁ_out (Mass Out)', width - 110, bottom - 40);
      }

      // Heat transfer flame/arrows at bottom (if not isolated)
      if (systemType !== 'isolated' && heatInput > 10) {
        const flameY = bottom + 14;
        const heatColor = isDark ? '#f97316' : '#c2410c';
        const flameColor = isDark
          ? (heatInput > 60 ? '#f97316' : '#eab308')
          : (heatInput > 60 ? '#ea580c' : '#d97706');
        ctx.fillStyle = flameColor;
        ctx.beginPath();
        for (let x = left + 20; x < right - 20; x += 30) {
          ctx.arc(x, flameY, 6 + Math.sin(Date.now() * 0.01 + x) * 2, 0, Math.PI * 2);
        }
        ctx.fill();

        // Heat flow arrow
        ctx.strokeStyle = heatColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(width / 2, flameY + 16);
        ctx.lineTo(width / 2, bottom - 5);
        ctx.lineTo(width / 2 - 5, bottom + 5);
        ctx.moveTo(width / 2, bottom - 5);
        ctx.lineTo(width / 2 + 5, bottom + 5);
        ctx.stroke();
        ctx.fillStyle = heatColor;
        ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        // Sits clear of the flame row, whose discs reach flameY + 8
        ctx.fillText('Heat Supply (Q > 0)', width / 2, flameY + 26);
        ctx.textAlign = 'left';
      }

      // Update & Draw Particles
      if (isPlaying) {
        particlesRef.current.forEach((p) => {
          p.x += p.vx * speedFactor;
          p.y += p.vy * speedFactor;

          // Horizontal bounds
          if (systemType === 'open') {
            if (p.x < left && p.y < top + 30) p.vx = Math.abs(p.vx);
            if (p.x < 10) {
              p.x = right - 10;
              p.y = bottom - 20 + Math.random() * 20;
            }
            if (p.x > width - 10) {
              p.x = 15;
              p.y = top + 40 + Math.random() * 20;
            }
          } else {
            if (p.x - p.radius < left) {
              p.x = left + p.radius;
              p.vx = -p.vx;
            }
            if (p.x + p.radius > right) {
              p.x = right - p.radius;
              p.vx = -p.vx;
            }
          }

          // Vertical bounds
          if (p.y - p.radius < top) {
            p.y = top + p.radius;
            p.vy = -p.vy;
          }
          if (p.y + p.radius > bottom) {
            p.y = bottom - p.radius;
            p.vy = -p.vy;
          }

          // Particle color based on temperature
          const r = Math.min(255, Math.floor(56 + (temperature - 300) * 0.7));
          const g = Math.max(100, Math.floor(189 - (temperature - 300) * 0.3));
          const b = Math.max(80, Math.floor(248 - (temperature - 300) * 0.6));
          p.color = `rgb(${r}, ${g}, ${b})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        });
      }

      // Labeling system
      ctx.fillStyle = ct.textMain;
      ctx.font = 'bold 13px Plus Jakarta Sans, sans-serif';
      ctx.fillText(
        systemType === 'closed'
          ? 'CLOSED SYSTEM (Control Mass, Δm = 0)'
          : systemType === 'open'
          ? 'OPEN SYSTEM (Control Volume, Δm ≠ 0)'
          : 'ISOLATED SYSTEM (No Heat, No Work, No Mass)',
        20,
        25
      );

      if (isPlaying && shouldAnimate) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animationFrameId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, shouldAnimate, systemType, temperature, pistonPosition, heatInput, isDark]);

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="card-heading text-slate-900 dark:text-white">Interactive Thermodynamic Systems & Boundaries</h4>
            <p className="secondary-text text-slate-600 dark:text-slate-400">Visual particle dynamics, boundary displacement, and energy interactions</p>
          </div>
        </div>

        {/* System Selectors */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['closed', 'open', 'isolated'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSystemType(type)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all ${
                systemType === type
                  ? 'bg-cyan-600 text-white shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              {type} System
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center items-center">
        <canvas ref={canvasRef} width={640} height={320} className="w-full max-w-2xl h-auto" />
      </div>

      {/* Live Readout & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Mass Transfer (Δm)</span>
          <div className="text-base font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2 mt-0.5">
            {systemType === 'open' ? 'Permeable (ṁ > 0)' : 'Impermeable (m = Const)'}
          </div>
          <p className="secondary-text text-slate-500 dark:text-slate-400">
            {systemType === 'open' ? 'Mass crosses control surface' : 'Mass remains strictly fixed inside'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Energy Transfer (Q & W)</span>
          <div className="text-base font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mt-0.5">
            {systemType === 'isolated' ? 'Zero (Q = 0, W = 0)' : `Active (T = ${temperature} K)`}
          </div>
          <p className="secondary-text text-slate-500 dark:text-slate-400">
            {systemType === 'isolated' ? 'Rigid insulated adiabatic wall' : 'Heat flux & displacement work allowed'}
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider">Real-World Analog</span>
          <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
            {systemType === 'closed'
              ? 'Piston-Cylinder, Sealed Can'
              : systemType === 'open'
              ? 'Turbine, Nozzle, Compressor'
              : 'Thermos Flask, Universe'}
          </div>
          <p className="secondary-text text-slate-500 dark:text-slate-400">
            {systemType === 'closed' ? 'Control Mass approach' : systemType === 'open' ? 'Control Volume approach' : 'Perfect isolation'}
          </p>
        </div>
      </div>

      {/* Control Sliders */}
      {systemType !== 'isolated' && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3 flex-1 min-w-[240px]">
            <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">Heat Supply (Q):</span>
            <input
              type="range"
              min="0"
              max="100"
              value={heatInput}
              onChange={(e) => setHeatInput(Number(e.target.value))}
              className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-orange-500 touch-pan-y"
            />
            <span className="text-sm font-mono font-bold text-orange-600 dark:text-orange-400 w-12 text-right">{heatInput}%</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                setHeatInput(50);
                setIsPlaying(true);
              }}
              className="w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe={
          systemType === 'closed'
            ? 'Mass particles cannot cross the solid boundary (m = constant), but energy crosses freely via heat conduction through the wall and boundary work via the movable piston.'
            : systemType === 'open'
            ? 'Both mass particles and energy (heat and work) cross freely across the permeable control surface (inlet and exit ports).'
            : 'Neither mass particles nor energy can penetrate the rigid, adiabatic outer boundary. Total energy and mass remain strictly constant.'
        }
        reason="System classification is defined by boundary permeability to mass and energy transfer. Real boundaries can be fixed or movable, real or imaginary, diathermal (heat permeable) or adiabatic (heat impermeable)."
        takeaway="Closed System (Control Mass): $\Delta m = 0, Q \neq 0, W \neq 0$. Open System (Control Volume): $\Delta m \neq 0, \Delta E \neq 0$. Isolated System: $\Delta m = 0, Q = 0, W = 0$."
        governingEquation="\text{Universe} = \text{System} + \text{Surroundings} \quad \text{and} \quad \Delta E_{\text{isolated}} = 0"
        stateValues={[
          { label: 'System Type', value: systemType.toUpperCase(), highlight: true },
          { label: 'Mass Transfer', value: systemType === 'open' ? 'Permitted (Δm ≠ 0)' : 'Blocked (Δm = 0)' },
          { label: 'Energy Transfer', value: systemType === 'isolated' ? 'Blocked (Q=0, W=0)' : 'Permitted (Q, W)' },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Thermodynamic System Boundary Classification"
        badge="BASIC CONCEPTS REVISION"
        explanation="A thermodynamic system is a region in space or quantity of matter chosen for thermodynamic analysis. The boundary separating it from the external surroundings determines mass and energy permeability."
        equation="\text{Universe} = \text{System} + \text{Surroundings} \quad \text{with} \quad \Delta E_{\text{univ}} = 0"
        secondaryEquation="\text{Closed: } \Delta m = 0, \Delta E \neq 0 \quad | \quad \text{Open: } \Delta m \neq 0, \Delta E \neq 0 \quad | \quad \text{Isolated: } \Delta m = 0, \Delta E = 0"
        specialCases={[
          {
            label: '1. Closed System (Control Mass)',
            condition: '\Delta m = 0, \; Q \neq 0, \; W \neq 0',
            result: 'Mass remains fixed. Energy crosses as heat or boundary work. Example: Gas sealed inside a piston-cylinder.',
          },
          {
            label: '2. Open System (Control Volume)',
            condition: '\Delta m \neq 0, \; \Delta E \neq 0',
            result: 'Both fluid mass and energy flow across control surface. Example: Steam turbines, pumps, jet nozzles, boilers.',
          },
          {
            label: '3. Isolated System',
            condition: '\Delta m = 0, \; Q = 0, \; W = 0',
            result: 'Rigid, impermeable, and perfectly adiabatic walls. Neither mass nor energy can cross. Example: The entire Universe.',
          },
          {
            label: '4. Boundary Attributes',
            condition: '\text{Diathermal vs Adiabatic}, \; \text{Rigid vs Movable}',
            result: 'Diathermal walls allow heat ($Q \\neq 0$). Adiabatic walls block heat ($Q = 0$). Rigid walls block boundary work ($dV = 0 \\implies W = 0$).',
          },
        ]}
        symbols={[
          { symbol: 'm', name: 'System Mass', unit: 'kg', description: 'Quantity of matter enclosed within system boundary' },
          { symbol: 'Q', name: 'Heat Transfer Across Boundary', unit: 'kJ', description: 'Energy driven across boundary by temperature difference' },
          { symbol: 'W', name: 'Work Transfer Across Boundary', unit: 'kJ', description: 'Boundary displacement or shaft work transfer' },
          { symbol: 'E', name: 'Total System Energy', unit: 'kJ', description: 'Sum of internal, kinetic, and potential energy: U + KE + PE' },
        ]}
        takeaway="Thermodynamic state is uniquely defined by intensive properties. A system is in complete thermodynamic equilibrium if and only if thermal ($T_1 = T_2$), mechanical ($P_1 = P_2$), and chemical ($\mu_1 = \mu_2$) equilibria are simultaneously satisfied."
        validity="Fundamental thermodynamic definitions applicable across all classical thermodynamic systems and continuum mechanics."
        variant="emerald"
      />
    </div>
  );
};
