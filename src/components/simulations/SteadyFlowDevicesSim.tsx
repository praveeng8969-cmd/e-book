import React, { useState, useEffect, useRef } from 'react';
import { Wind, Play, Pause, RotateCcw, ArrowRight, Cog, ShieldAlert, Cpu } from 'lucide-react';
import { MathView, MathText } from '../MathView';
import { useTheme } from '../../context/ThemeContext';
import { getCanvasTheme } from '../../utils/canvasTheme';
import { RevisionCard } from '../RevisionCard';
import { ObservationCallout } from '../ObservationCallout';
import { useSimulationAnimation } from '../../utils/useSimulationAnimation';

type DeviceType = 'nozzle' | 'diffuser' | 'turbine' | 'compressor' | 'throttling';

export const SteadyFlowDevicesSim: React.FC = () => {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { shouldAnimate } = useSimulationAnimation(containerRef);
  const [device, setDevice] = useState<DeviceType>('nozzle');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [inletEnthalpy, setInletEnthalpy] = useState<number>(3200); // kJ/kg
  const [inletVelocity, setInletVelocity] = useState<number>(50); // m/s
  const [pressureRatio, setPressureRatio] = useState<number>(4); // P1/P2 or P2/P1
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Particles for stream visualization
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number }>>([]);

  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      pts.push({
        x: Math.random() * 600,
        y: 100 + Math.random() * 120,
        vx: 2 + Math.random() * 2,
        vy: (Math.random() - 0.5) * 0.5,
        color: '#38bdf8',
        size: 3 + Math.random() * 2,
      });
    }
    particlesRef.current = pts;
  }, [device]);

  // Derived properties based on SFEE
  let exitEnthalpy = inletEnthalpy;
  let exitVelocity = inletVelocity;
  let workOutput = 0;
  let sfeeFormula = '';
  let deviceDescription = '';

  switch (device) {
    case 'nozzle':
      // Converts enthalpy drop to kinetic energy increase
      // h1 + C1^2/2000 = h2 + C2^2/2000 => C2 = sqrt(C1^2 + 2000*(h1 - h2))
      const enthalpyDropNozzle = 250;
      exitEnthalpy = inletEnthalpy - enthalpyDropNozzle;
      exitVelocity = Math.sqrt(Math.pow(inletVelocity, 2) + 2000 * enthalpyDropNozzle);
      workOutput = 0;
      sfeeFormula = 'h_1 + \\frac{C_1^2}{2} = h_2 + \\frac{C_2^2}{2} \\implies C_2 = \\sqrt{C_1^2 + 2(h_1 - h_2)}';
      deviceDescription = 'Converging device that increases fluid velocity ($C_2 > C_1$) at the expense of pressure and enthalpy ($P_2 < P_1$, $h_2 < h_1$). Work transfer $W_{cv} = 0$, heat transfer $Q = 0$.';
      break;

    case 'diffuser':
      // Converts kinetic energy to enthalpy and pressure rise
      exitVelocity = Math.max(10, inletVelocity * 0.25);
      exitEnthalpy = inletEnthalpy + (Math.pow(inletVelocity, 2) - Math.pow(exitVelocity, 2)) / 2000;
      workOutput = 0;
      sfeeFormula = 'h_1 + \\frac{C_1^2}{2} = h_2 + \\frac{C_2^2}{2} \\implies h_2 = h_1 + \\frac{C_1^2 - C_2^2}{2}';
      deviceDescription = 'Diverging passage that decelerates fluid ($C_2 < C_1$) to achieve static pressure recovery ($P_2 > P_1$). $W_{cv} = 0$, $Q = 0$.';
      break;

    case 'turbine':
      // Work producing expansion: W_T = h1 - h2 (neglecting KE & PE)
      const turbineEnthalpyDrop = 750;
      exitEnthalpy = inletEnthalpy - turbineEnthalpyDrop;
      exitVelocity = inletVelocity * 1.1;
      workOutput = turbineEnthalpyDrop;
      sfeeFormula = 'W_{\\text{turbine}} = h_1 - h_2 \\quad (\\text{Work Producing}, W_{cv} > 0)';
      deviceDescription = 'Fluid expands through turbine blades, converting enthalpy drop into mechanical shaft work ($W_T = h_1 - h_2$). Widely used in steam and gas power plants.';
      break;

    case 'compressor':
      // Work absorbing compression: W_C = h2 - h1
      const compressorEnthalpyRise = 450;
      exitEnthalpy = inletEnthalpy + compressorEnthalpyRise;
      exitVelocity = inletVelocity * 0.9;
      workOutput = -compressorEnthalpyRise;
      sfeeFormula = 'W_{\\text{compressor}} = h_2 - h_1 \\quad (\\text{Work Absorbing}, W_{cv} < 0)';
      deviceDescription = 'External shaft power is supplied to compress gas, raising both pressure ($P_2 > P_1$) and enthalpy ($h_2 > h_1$). $W_{in} = h_2 - h_1$.';
      break;

    case 'throttling':
      // Isenthalpic expansion across porous plug / restriction: h1 = h2
      exitEnthalpy = inletEnthalpy;
      exitVelocity = inletVelocity;
      workOutput = 0;
      sfeeFormula = 'h_1 = h_2 \\quad (\\text{Isenthalpic Process}, \\Delta h = 0, W=0, Q=0)';
      deviceDescription = 'Fluid flows through a porous plug or partially open valve. High frictional resistance causes a substantial pressure drop ($P_1 \\gg P_2$) at constant enthalpy ($h_1 = h_2$). Irreversible.';
      break;
  }

  // Animation Frame
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;

      const ct = getCanvasTheme();

      // Background
      ctx.fillStyle = ct.bg;
      ctx.fillRect(0, 0, width, height);

      const dLeft = 140;
      const dRight = width - 140;
      const dCenterY = height / 2;

      // Draw Device Casing Geometry based on type
      ctx.fillStyle = ct.isLight ? '#e2e8f0' : '#1e293b';
      ctx.strokeStyle = ct.containerBorder;
      ctx.lineWidth = 4;

      if (device === 'nozzle') {
        // Converging duct (wide inlet, narrow exit)
        ctx.beginPath();
        ctx.moveTo(dLeft, dCenterY - 80);
        ctx.lineTo(dRight, dCenterY - 30);
        ctx.lineTo(dRight, dCenterY + 30);
        ctx.lineTo(dLeft, dCenterY + 80);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (device === 'diffuser') {
        // Diverging duct (narrow inlet, wide exit)
        ctx.beginPath();
        ctx.moveTo(dLeft, dCenterY - 30);
        ctx.lineTo(dRight, dCenterY - 85);
        ctx.lineTo(dRight, dCenterY + 85);
        ctx.lineTo(dLeft, dCenterY + 30);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (device === 'turbine') {
        // Turbine casing (diverging with rotating shaft & blades)
        ctx.beginPath();
        ctx.moveTo(dLeft, dCenterY - 45);
        ctx.lineTo(dRight, dCenterY - 95);
        ctx.lineTo(dRight, dCenterY + 95);
        ctx.lineTo(dLeft, dCenterY + 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rotating rotor shaft
        const shaftAngle = Date.now() * 0.005;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc((dLeft + dRight) / 2, dCenterY, 30, 0, Math.PI * 2);
        ctx.fill();

        // Rotor blades
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const a = shaftAngle + (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo((dLeft + dRight) / 2, dCenterY);
          ctx.lineTo((dLeft + dRight) / 2 + Math.cos(a) * 45, dCenterY + Math.sin(a) * 45);
          ctx.stroke();
        }

        // Shaft work output arrow
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo((dLeft + dRight) / 2, dCenterY - 100);
        ctx.lineTo((dLeft + dRight) / 2 + 50, dCenterY - 100);
        ctx.lineTo((dLeft + dRight) / 2 + 42, dCenterY - 105);
        ctx.moveTo((dLeft + dRight) / 2 + 50, dCenterY - 100);
        ctx.lineTo((dLeft + dRight) / 2 + 42, dCenterY - 95);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`Shaft work = +${workOutput} kJ/kg`, (dLeft + dRight) / 2 - 10, dCenterY - 110);
      } else if (device === 'compressor') {
        // Compressor casing (converging with rotating impeller)
        ctx.beginPath();
        ctx.moveTo(dLeft, dCenterY - 95);
        ctx.lineTo(dRight, dCenterY - 45);
        ctx.lineTo(dRight, dCenterY + 45);
        ctx.lineTo(dLeft, dCenterY + 95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rotating rotor
        const shaftAngle = Date.now() * -0.006;
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc((dLeft + dRight) / 2, dCenterY, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          const a = shaftAngle + (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo((dLeft + dRight) / 2, dCenterY);
          ctx.lineTo((dLeft + dRight) / 2 + Math.cos(a) * 45, dCenterY + Math.sin(a) * 45);
          ctx.stroke();
        }

        // Shaft work input arrow
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo((dLeft + dRight) / 2 - 50, dCenterY - 100);
        ctx.lineTo((dLeft + dRight) / 2, dCenterY - 100);
        ctx.lineTo((dLeft + dRight) / 2 - 8, dCenterY - 105);
        ctx.moveTo((dLeft + dRight) / 2, dCenterY - 100);
        ctx.lineTo((dLeft + dRight) / 2 - 8, dCenterY - 95);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`Work input = −${Math.abs(workOutput)} kJ/kg`, (dLeft + dRight) / 2 - 40, dCenterY - 110);
      } else if (device === 'throttling') {
        // Porous Plug Throttling Valve
        ctx.beginPath();
        ctx.moveTo(dLeft, dCenterY - 45);
        ctx.lineTo(dRight, dCenterY - 45);
        ctx.lineTo(dRight, dCenterY + 45);
        ctx.lineTo(dLeft, dCenterY + 45);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Porous friction matrix in middle
        const plugX = (dLeft + dRight) / 2 - 35;
        ctx.fillStyle = ct.isLight ? '#cbd5e1' : '#475569';
        ctx.fillRect(plugX, dCenterY - 43, 70, 86);
        ctx.strokeStyle = ct.containerBorder;
        ctx.strokeRect(plugX, dCenterY - 43, 70, 86);

        // Porous dots
        ctx.fillStyle = ct.isLight ? '#64748b' : '#0f172a';
        for (let py = dCenterY - 35; py <= dCenterY + 35; py += 12) {
          for (let px = plugX + 8; px <= plugX + 62; px += 10) {
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.fillStyle = ct.textMuted;
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText('Porous Plug Matrix', plugX - 15, dCenterY - 55);
      }

      // Inflow & Outflow Pipes
      ctx.strokeStyle = ct.containerBorder;
      ctx.lineWidth = 3;
      // Left inlet pipe
      ctx.beginPath();
      ctx.moveTo(20, dCenterY - 35);
      ctx.lineTo(dLeft, dCenterY - 35);
      ctx.moveTo(20, dCenterY + 35);
      ctx.lineTo(dLeft, dCenterY + 35);
      ctx.stroke();

      // Right exit pipe
      ctx.beginPath();
      ctx.moveTo(dRight, dCenterY - 30);
      ctx.lineTo(width - 20, dCenterY - 30);
      ctx.moveTo(dRight, dCenterY + 30);
      ctx.lineTo(width - 20, dCenterY + 30);
      ctx.stroke();

      // Draw Flow Particles with dynamic velocity speedup/slowdown
      if (isPlaying) {
        particlesRef.current.forEach((p) => {
          // Determine local duct width & speed factor
          let speedMul = 1.0;
          if (p.x < dLeft) {
            speedMul = inletVelocity / 50;
          } else if (p.x > dRight) {
            speedMul = exitVelocity / 50;
          } else {
            const frac = (p.x - dLeft) / (dRight - dLeft);
            const curVel = inletVelocity + (exitVelocity - inletVelocity) * frac;
            speedMul = curVel / 50;
          }

          p.x += p.vx * speedMul;
          if (p.x > width - 20) {
            p.x = 25;
            p.y = dCenterY - 25 + Math.random() * 50;
          }

          // Particle color based on velocity/temperature
          ctx.fillStyle = device === 'turbine' ? (ct.isLight ? '#0284c7' : '#38bdf8') : device === 'compressor' ? (ct.isLight ? '#d97706' : '#f59e0b') : (ct.isLight ? '#0891b2' : '#06b6d4');
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // State 1 & State 2 Labels
      ctx.fillStyle = ct.primary;
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText('STATE 1 (INLET)', 25, 30);
      ctx.fillStyle = ct.textMuted;
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`h₁ = ${inletEnthalpy} kJ/kg`, 25, 48);
      ctx.fillText(`C₁ = ${inletVelocity} m/s`, 25, 64);

      ctx.fillStyle = ct.success;
      ctx.font = 'bold 12px Plus Jakarta Sans, sans-serif';
      ctx.fillText('STATE 2 (EXIT)', width - 130, 30);
      ctx.fillStyle = ct.textMuted;
      ctx.font = '11px Plus Jakarta Sans, sans-serif';
      ctx.fillText(`h₂ = ${exitEnthalpy.toFixed(1)} kJ/kg`, width - 130, 48);
      ctx.fillText(`C₂ = ${exitVelocity.toFixed(1)} m/s`, width - 130, 64);

      if (isPlaying && shouldAnimate) {
        animId = requestAnimationFrame(render);
      }
    };

    if (shouldAnimate) {
      animId = requestAnimationFrame(render);
    }
    return () => cancelAnimationFrame(animId);
  }, [device, isPlaying, shouldAnimate, inletEnthalpy, inletVelocity, exitEnthalpy, exitVelocity, workOutput, isDark]);

  return (
    <div ref={containerRef} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs dark:shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Wind className="w-5 h-5" />
          </span>
          <div>
            <h4 className="card-heading text-slate-900 dark:text-white">Steady Flow Energy Equation (SFEE) Devices Lab</h4>
            <p className="secondary-text text-slate-600 dark:text-slate-400">First law analysis for Open Systems: Nozzle, Diffuser, Turbine, Compressor, & Throttling</p>
          </div>
        </div>

        {/* Device Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
          {(['nozzle', 'diffuser', 'turbine', 'compressor', 'throttling'] as DeviceType[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold capitalize transition-all ${
                device === d
                  ? 'bg-cyan-600 text-white shadow-xs dark:bg-cyan-500 dark:text-slate-950'
                  : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex justify-center items-center">
        <canvas ref={canvasRef} width={680} height={280} className="w-full max-w-3xl h-auto" />
      </div>

      {/* SFEE Governing Equation & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            Applied Steady Flow Energy Equation
          </span>
          <div className="text-sm font-bold text-slate-900 dark:text-white py-1">
            <MathView math={sfeeFormula} />
          </div>
          <p className="secondary-text text-slate-600 dark:text-slate-400">
            Full SFEE: <MathView math="h_1 + \frac{C_1^2}{2} + gz_1 + q = h_2 + \frac{C_2^2}{2} + gz_2 + w_{cv}" />
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Thermodynamic Behavior
          </span>
          <p className="body-text text-slate-700 dark:text-slate-300 pt-1 font-medium"><MathText text={deviceDescription} /></p>
        </div>
      </div>

      {/* Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-slate-800 dark:text-slate-300">Inlet Enthalpy (h₁):</span>
            <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold">{inletEnthalpy} kJ/kg</span>
          </div>
          <input
            type="range"
            min="2000"
            max="3800"
            step="50"
            value={inletEnthalpy}
            onChange={(e) => setInletEnthalpy(Number(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-cyan-500 touch-pan-y"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-slate-800 dark:text-slate-300">Inlet Velocity (C₁):</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{inletVelocity} m/s</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            step="5"
            value={inletVelocity}
            onChange={(e) => setInletVelocity(Number(e.target.value))}
            className="w-full h-8 py-2 bg-transparent appearance-none cursor-pointer accent-emerald-500 touch-pan-y"
          />
        </div>
      </div>

      {/* Pedagogical Observe / Reason / Exam Takeaway Callout */}
      <ObservationCallout
        observe={
          device === 'nozzle'
            ? 'Inlet fluid accelerates dramatically through the converging channel, increasing kinetic energy while pressure and enthalpy drop.'
            : device === 'diffuser'
            ? 'High-speed incoming fluid decelerates through the diverging duct, recovering pressure and enthalpy at the expense of kinetic energy.'
            : device === 'turbine'
            ? 'High-enthalpy fluid expands across rotating blades, producing external shaft work output ($W_{cv} = h_1 - h_2$).'
            : device === 'compressor'
            ? 'External work input ($W_{cv} = h_2 - h_1$) drives rotating impellers to boost fluid pressure and enthalpy.'
            : 'Fluid throttles across a restriction with zero work ($W=0$), zero heat ($Q=0$), and constant enthalpy ($h_1 = h_2$).'
        }
        reason="By the Steady Flow Energy Equation (SFEE), energy entering a control volume must equal energy leaving. When work is zero (nozzles), enthalpy drop directly powers kinetic energy gain (Δke). When shaft work is present (turbines), enthalpy drop produces mechanical work."
        takeaway="General SFEE: $\dot{Q} - \dot{W} = \dot{m}\left[(h_2 - h_1) + \frac{C_2^2 - C_1^2}{2} + g(z_2 - z_1)\right]$. Memorize the simplifications: Nozzles ($w=0$), Turbines ($q=0, \Delta ke \approx 0$), Throttling ($h_1 = h_2$)."
        governingEquation={sfeeFormula}
        stateValues={[
          { label: 'h_1 → h_2', value: `${inletEnthalpy} → ${exitEnthalpy.toFixed(0)}`, unit: 'kJ/kg' },
          { label: 'C_1 → C_2', value: `${inletVelocity} → ${exitVelocity.toFixed(0)}`, unit: 'm/s' },
          { label: 'Work', value: `${workOutput.toFixed(0)}`, unit: 'kJ/kg', highlight: workOutput !== 0 },
        ]}
      />

      {/* Standardized 5-Part Quick Revision Card */}
      <RevisionCard
        title="Steady Flow Energy Equation (SFEE) for Engineering Devices"
        badge="FIRST LAW OPEN SYSTEMS"
        explanation="For steady-flow open systems (Control Volumes) with a single inlet and single exit, conservation of mass and energy dictates that total energy entering equals total energy leaving under steady conditions."
        equation="\dot{Q} - \dot{W}_{cv} = \dot{m}\left[\left(h_2 - h_1\right) + \frac{C_2^2 - C_1^2}{2000} + \frac{g(z_2 - z_1)}{1000}\right]"
        secondaryEquation="\text{Per Unit Mass: } q - w = \left(h_2 - h_1\right) + \frac{\Delta C^2}{2} + g\Delta z"
        specialCases={[
          {
            label: '1. Steam / Gas Turbine',
            condition: 'q \approx 0, \; \Delta ke \approx 0, \; \Delta pe \approx 0',
            result: 'Work produced: $w_{\text{turb}} = h_1 - h_2$ [kJ/kg]. Enthalpy drop of high-pressure fluid produces shaft power.',
          },
          {
            label: '2. Gas Compressor / Pump',
            condition: 'q \approx 0, \; \Delta ke \approx 0, \; \Delta pe \approx 0',
            result: 'Work required: $w_{\text{comp}} = h_2 - h_1$ [kJ/kg]. External shaft power increases fluid pressure and enthalpy.',
          },
          {
            label: '3. Nozzle (Acceleration)',
            condition: 'w = 0, \; q \approx 0, \; \Delta pe \approx 0',
            result: 'Exit velocity: $C_2 = \\sqrt{C_1^2 + 2000(h_1 - h_2)}$ [m/s]. Converts enthalpy directly into kinetic energy.',
          },
          {
            label: '4. Throttling Valve',
            condition: 'q = 0, \; w = 0, \; \Delta ke \approx 0, \; \Delta pe \approx 0',
            result: 'Isenthalpic: $h_1 = h_2$. Flow is highly irreversible due to fluid friction across the restriction.',
          },
        ]}
        symbols={[
          { symbol: '\dot{m}', name: 'Mass Flow Rate', unit: 'kg/s', description: 'Fluid mass crossing control surface per second: ρ A C' },
          { symbol: 'h', name: 'Specific Enthalpy', unit: 'kJ/kg', description: 'Fluid internal energy plus flow work: u + Pv' },
          { symbol: 'C', name: 'Fluid Velocity', unit: 'm/s', description: 'Average flow velocity across channel cross-section' },
          { symbol: '\dot{W}_{cv}', name: 'Control Volume Shaft Work', unit: 'kW', description: 'Mechanical power delivered or absorbed across shaft' },
          { symbol: '\dot{Q}', name: 'Heat Transfer Rate', unit: 'kW', description: 'Thermal energy crossing control surface' },
        ]}
        takeaway="Remember the conversion factor: Enthalpy $h$ is in kJ/kg, but $\frac{C^2}{2}$ is in $\text{J/kg} = \text{m}^2/\text{s}^2$. Always divide velocity squared by 2000 (or $2 \times 10^3$) when adding to enthalpy in kJ/kg!"
        validity="Valid for steady, 1D flow of homogeneous fluids crossing a stationary control volume with constant mass inventory ($\frac{dm_{cv}}{dt} = 0$, $\frac{dE_{cv}}{dt} = 0$)."
        variant="teal"
      />
    </div>
  );
};
