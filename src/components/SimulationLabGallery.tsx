import React, { useState } from 'react';
import {
  SystemBoundarySim,
  PVDomainSim,
  CarnotCycleSim,
  SteadyFlowDevicesSim,
  PhaseChangeDomeSim,
  EntropyGenerationSim,
  JouleThomsonSim,
  GasMixtureSim,
} from './simulations';
import { Layers, Sparkles, Activity, Play, Gauge, RefreshCw, Zap, Droplet } from 'lucide-react';

export const SimulationLabGallery: React.FC = () => {
  const [selectedSim, setSelectedSim] = useState<string>('pv-domain');

  const SIMULATION_ITEMS = [
    {
      id: 'system-boundary',
      title: '1. Thermodynamic System Boundaries & Mass/Energy Flux',
      chapter: 'Chapter 1: Basic Concepts',
      desc: 'Visual particle simulation comparing Closed (Control Mass), Open (Control Volume), and Isolated systems with thermal flux and movable piston boundaries.',
      icon: <Gauge className="w-4 h-4 text-cyan-400" />,
      component: <SystemBoundarySim />,
    },
    {
      id: 'pv-domain',
      title: '2. Dynamic P-V Work Integrator & Non-Flow Processes',
      chapter: 'Chapter 3: Energy Interactions',
      desc: 'Interactive displacement work integration W = ∫PdV with polytropic index n slider (-∞ to +∞), slope calculations, and live particle kinetics.',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      component: <PVDomainSim />,
    },
    {
      id: 'carnot-cycle',
      title: '3. Synchronized Dual P-V & T-S Carnot Cycle Engine',
      chapter: 'Chapter 4: Second Law of Thermodynamics',
      desc: 'Real-time 4-stroke cycle animation with animated piston assembly, heat addition/rejection reservoirs, work area integration, and Carnot efficiency.',
      icon: <RefreshCw className="w-4 h-4 text-amber-400" />,
      component: <CarnotCycleSim />,
    },
    {
      id: 'sfee-devices',
      title: '4. Open System SFEE Steady Flow Device Simulator',
      chapter: 'Chapter 3: Energy Interactions',
      desc: 'Interactive Control Volume analyzer for Nozzles, Diffusers, Steam Turbines, Gas Compressors, and Isenthalpic Throttling Valves.',
      icon: <Zap className="w-4 h-4 text-purple-400" />,
      component: <SteadyFlowDevicesSim />,
    },
    {
      id: 'phase-dome',
      title: '5. Multi-Domain Phase Change Dome (T-s, P-v, h-s)',
      chapter: 'Chapter 8: Pure Substances',
      desc: 'State tracking in Subcooled, Saturated Liquid (x=0), Wet Liquid-Vapor (0<x<1), Saturated Vapor (x=1), and Superheated steam regions.',
      icon: <Droplet className="w-4 h-4 text-blue-400" />,
      component: <PhaseChangeDomeSim />,
    },
    {
      id: 'entropy-gen',
      title: '6. Entropy Generation & Gouy-Stodola Exergy Destruction',
      chapter: 'Chapter 5 & 6: Entropy & Exergy',
      desc: 'Thermal conduction across finite ΔT with entropy increase (ΔS_univ ≥ 0) and irreversibility I = T0 · Sgen rate calculations.',
      icon: <Sparkles className="w-4 h-4 text-rose-400" />,
      component: <EntropyGenerationSim />,
    },
    {
      id: 'joule-thomson',
      title: '7. Joule-Thomson Effect & Inversion Curve Throttling',
      chapter: 'Chapter 9: Thermodynamic Relations',
      desc: 'Porous plug throttling simulator showing cooling vs heating regimes, inversion temperature curve, and μ_JT evaluation.',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      component: <JouleThomsonSim />,
    },
    {
      id: 'gas-mixture',
      title: '8. Dalton & Amagat Gas Mixture Chamber',
      chapter: 'Chapter 7: Gas Mixtures',
      desc: 'Dual-species kinetic gas mixing chamber showing Dalton partial pressures, mole fractions, and apparent molecular weight Me.',
      icon: <Activity className="w-4 h-4 text-indigo-400" />,
      component: <GasMixtureSim />,
    },
  ];

  const current = SIMULATION_ITEMS.find((s) => s.id === selectedSim) || SIMULATION_ITEMS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              Thermodynamic Simulation & Animation Lab
            </h2>
          </div>
        </div>

        {/* Quick Simulator Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-3 border-t border-slate-200 dark:border-slate-800">
          {SIMULATION_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedSim(item.id)}
              className={`p-3 rounded-xl border text-left text-xs transition-all ${
                selectedSim === item.id
                  ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-bold shadow-sm dark:bg-cyan-500/15 dark:border-cyan-500 dark:text-white dark:shadow-md'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="font-bold truncate text-slate-900 dark:text-slate-200">{item.title.split('. ')[1]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Simulation Container */}
      <div className="space-y-4">
        <div>{current.component}</div>
      </div>
    </div>
  );
};
