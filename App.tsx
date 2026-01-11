import React, { useState } from 'react';
import { Battery, Wind, ArrowDownCircle, Info, Zap, Sun, Activity } from 'lucide-react';
import { SimulationType } from './types';
import BatteryBulbSimulation from './simulations/BatteryBulb';
import WindmillSimulation from './simulations/Windmill';
import FallingObjectSimulation from './simulations/FallingObject';
import SolarPanelSimulation from './simulations/SolarPanel';
import ElasticSpringSimulation from './simulations/ElasticSpring';

const App: React.FC = () => {
  const [currentSim, setCurrentSim] = useState<SimulationType>(SimulationType.BATTERY_BULB);
  const [showInfo, setShowInfo] = useState(false);

  // Navigation config
  const simulations = [
    { id: SimulationType.BATTERY_BULB, label: 'Circuit', icon: <Battery size={20} /> },
    { id: SimulationType.SOLAR_PANEL, label: 'Solar', icon: <Sun size={20} /> },
    { id: SimulationType.WINDMILL, label: 'Wind', icon: <Wind size={20} /> },
    { id: SimulationType.ELASTIC_SPRING, label: 'Spring', icon: <Activity size={20} /> },
    { id: SimulationType.FALLING_OBJECT, label: 'Gravity', icon: <ArrowDownCircle size={20} /> },
  ];

  const renderSimulation = () => {
    switch (currentSim) {
      case SimulationType.BATTERY_BULB:
        return <BatteryBulbSimulation />;
      case SimulationType.WINDMILL:
        return <WindmillSimulation />;
      case SimulationType.FALLING_OBJECT:
        return <FallingObjectSimulation />;
      case SimulationType.SOLAR_PANEL:
        return <SolarPanelSimulation />;
      case SimulationType.ELASTIC_SPRING:
        return <ElasticSpringSimulation />;
      default:
        return <BatteryBulbSimulation />;
    }
  };

  const getExplanation = () => {
      switch(currentSim) {
          case SimulationType.BATTERY_BULB:
              return "Energy is stored in the batteries. It flows through the wires only when the switch closes the loop, transforming into light and heat in the bulbs.";
          case SimulationType.WINDMILL:
              return "The wind carries kinetic energy. The windmill blades capture this energy, transferring it into rotational motion to do work.";
          case SimulationType.FALLING_OBJECT:
              return "Lifting the object against gravity stores Potential Energy. Releasing it converts that stored energy into Kinetic Energy (motion) until impact.";
          case SimulationType.SOLAR_PANEL:
              return "Sunlight (Radiant Energy) excites electrons in the panel. Efficiency depends on the angle of the sun and obstructions like clouds.";
          case SimulationType.ELASTIC_SPRING:
              return "Compressing a spring stores Elastic Potential Energy. When released, this stored energy rapidly converts into motion (Kinetic Energy).";
          default: return "";
      }
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30">
      {/* --- Header --- */}
      <header className="flex-none pt-safe px-4 pb-3 bg-slate-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-brand-600 to-brand-400 p-1.5 rounded-lg shadow-glow">
                <Zap size={18} className="text-white" fill="currentColor"/>
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                FunWeb Physics: ENERGY
            </h1>
        </div>
        <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-full transition-all duration-200 ${showInfo ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            aria-label="Show explanation"
        >
            <Info size={24} />
        </button>
      </header>

      {/* --- Info Modal/Panel --- */}
      {showInfo && (
          <div className="relative z-20">
            <div className="absolute top-0 left-0 right-0 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700 p-6 text-slate-200 text-sm leading-relaxed shadow-xl animate-in fade-in slide-in-from-top-2">
                <p className="font-bold text-brand-400 mb-2 uppercase text-xs tracking-wider">Physics Concept</p>
                <p>{getExplanation()}</p>
            </div>
          </div>
      )}

      {/* --- Main Content Area --- */}
      {/* Container constraints for large screens, full width for mobile */}
      <main className="flex-1 flex flex-col relative w-full max-w-2xl mx-auto bg-slate-950 overflow-hidden lg:border-x lg:border-white/5">
        {renderSimulation()}
      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="flex-none bg-slate-900/90 backdrop-blur-lg border-t border-white/5 pb-safe z-30">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
          {simulations.map((sim) => {
            const isActive = currentSim === sim.id;
            return (
                <button
                key={sim.id}
                onClick={() => setCurrentSim(sim.id)}
                className="flex-1 group relative flex flex-col items-center justify-center gap-1.5 h-full min-w-[50px]"
                >
                {/* Active Indicator Line */}
                {isActive && (
                    <span className="absolute top-0 w-8 h-0.5 bg-brand-500 rounded-b-full shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                )}
                
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                    isActive 
                    ? 'text-brand-400 scale-110' 
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                    {sim.icon}
                </div>
                <span className={`text-[9px] font-medium tracking-wide transition-colors ${
                    isActive ? 'text-brand-100' : 'text-slate-500'
                }`}>
                    {sim.label}
                </span>
                </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default App;