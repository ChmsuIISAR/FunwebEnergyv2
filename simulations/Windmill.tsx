import React, { useState, useCallback, useRef, useEffect } from 'react';
import SimulationCanvas from '../components/SimulationCanvas';
import ControlPanel from '../components/ControlPanel';
import { Slider, ActionButton } from '../components/ui/Controls';
import { RefreshCcw, Wind, Zap } from 'lucide-react';

const WindmillSimulation: React.FC = () => {
  // --- State ---
  const [windSpeed, setWindSpeed] = useState<number>(40);
  const [storedEnergy, setStoredEnergy] = useState<number>(0); // 0 to 100%
  
  // Animation Refs
  const rotationRef = useRef(0);
  const energyRef = useRef(0); 

  useEffect(() => {
    energyRef.current = storedEnergy;
  }, [storedEnergy]);

  // --- Physics Constants ---
  const CUT_IN_THRESHOLD = 20;   
  const CUT_OUT_THRESHOLD = 85; 

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    const scale = Math.min(width, height) / 1000;
    const offsetX = (width - 1000 * scale) / 2;
    const offsetY = (height - 1000 * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
    if (windSpeed > 80) {
        gradient.addColorStop(0, '#1e1b4b'); 
        gradient.addColorStop(1, '#334155'); 
    } else {
        gradient.addColorStop(0, '#0f172a'); 
        gradient.addColorStop(1, '#1e293b'); 
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1000, 1000);

    const starCount = 50;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < starCount; i++) {
        const sx = (Math.sin(i * 132.1) * 43758.5453 % 1) * 1000;
        const sy = (Math.cos(i * 42.5) * 43758.5453 % 1) * 600; 
        const size = (i % 3 === 0) ? 2 : 1;
        const flicker = Math.sin(frame * 0.05 + i) * 0.3 + 0.7;
        ctx.globalAlpha = flicker * 0.5;
        ctx.beginPath(); ctx.arc(sx, sy, size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = '#020617'; 
    ctx.beginPath();
    ctx.moveTo(0, 850); ctx.bezierCurveTo(300, 830, 700, 830, 1000, 850);
    ctx.lineTo(1000, 1000); ctx.lineTo(0, 1000); ctx.fill();

    let currentRpm = 0;
    let statusText = "OPTIMAL";
    let statusColor = "#4ade80"; 

    if (windSpeed === 0) {
        currentRpm = 0;
        statusText = "NO WIND";
        statusColor = "#94a3b8";
    } else if (windSpeed < CUT_IN_THRESHOLD) {
        currentRpm = 0;
        statusText = "STALLED (LOW WIND)";
        statusColor = "#fbbf24"; 
    } else if (windSpeed > CUT_OUT_THRESHOLD) {
        currentRpm = 0; 
        statusText = "BRAKED (HIGH WIND)";
        statusColor = "#ef4444"; 
    } else {
        currentRpm = (windSpeed / 100);
    }

    rotationRef.current += currentRpm * 0.25; 

    if (windSpeed > 0) {
      const particleCount = 40;
      ctx.lineCap = 'round';
      for (let i = 0; i < particleCount; i++) {
        const speedMultiplier = (windSpeed / 100);
        const pSpeed = (speedMultiplier * 20) + 5; 
        const pLength = (speedMultiplier * 200) + 50; 
        const pAlpha = (speedMultiplier * 0.5) + 0.1; 
        const cycle = 1500 + pLength;
        const offset = (i * 937) % cycle;
        let x = ((frame * pSpeed) + offset) % cycle - 200;
        let y = 100 + ((i * 37) % 600) + Math.sin(x * 0.002 + frame * 0.01) * 20;
        const grad = ctx.createLinearGradient(x, y, x - pLength, y);
        grad.addColorStop(0, `rgba(224, 242, 254, 0)`);
        grad.addColorStop(0.2, `rgba(224, 242, 254, ${pAlpha})`);
        grad.addColorStop(1, `rgba(224, 242, 254, 0)`);
        ctx.strokeStyle = grad; ctx.lineWidth = 2 + speedMultiplier * 4; 
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - pLength, y); ctx.stroke();
      }
    }

    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(490, 300); ctx.lineTo(510, 300); ctx.lineTo(540, 900); ctx.lineTo(460, 900); ctx.fill();

    ctx.save();
    ctx.translate(500, 300);
    ctx.rotate(rotationRef.current);
    const bladeColor = (windSpeed > CUT_OUT_THRESHOLD) ? '#fca5a5' : '#f1f5f9';
    const bladeStroke = (windSpeed > CUT_OUT_THRESHOLD) ? '#ef4444' : '#cbd5e1';
    ctx.fillStyle = bladeColor; ctx.strokeStyle = bladeStroke; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.rotate((Math.PI * 2 / 3) * i);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(15, -40); ctx.lineTo(10, -280); ctx.quadraticCurveTo(0, -300, -10, -280); ctx.lineTo(-15, -40); ctx.lineTo(0, 0);
      const bladeGrad = ctx.createLinearGradient(0, 0, 0, -300); bladeGrad.addColorStop(0, bladeColor); bladeGrad.addColorStop(1, '#f8fafc');
      ctx.fillStyle = bladeGrad; ctx.fill(); ctx.stroke(); ctx.restore();
    }
    ctx.restore(); 

    ctx.save(); ctx.translate(500, 300); ctx.rotate(rotationRef.current);
    ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    
    const stationX = 650;
    const stationY = 780;
    
    ctx.strokeStyle = currentRpm > 0 ? '#fbbf24' : '#334155';
    ctx.lineWidth = 4;
    ctx.setLineDash(currentRpm > 0 ? [10, 10] : []);
    if (currentRpm > 0) ctx.lineDashOffset = -frame * 2;
    ctx.beginPath(); ctx.moveTo(500, 300); ctx.bezierCurveTo(500, 600, stationX, 600, stationX, stationY); ctx.stroke(); ctx.setLineDash([]);

    ctx.fillStyle = '#1e293b'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.fillRect(stationX - 40, stationY, 80, 120); ctx.strokeRect(stationX - 40, stationY, 80, 120);
    ctx.fillStyle = '#475569'; ctx.fillRect(stationX - 20, stationY - 10, 40, 10);

    const fillHeight = (energyRef.current / 100) * 110; 
    const chargeColor = energyRef.current > 80 ? '#22c55e' : energyRef.current > 30 ? '#eab308' : '#ef4444';
    ctx.fillStyle = chargeColor; ctx.fillRect(stationX - 35, stationY + 115 - fillHeight, 70, fillHeight);
    
    if (currentRpm > 0) {
        ctx.fillStyle = '#ffffff'; ctx.font = '24px sans-serif'; ctx.fillText('⚡', stationX - 10, stationY + 60);
    }

    const towerX = 860;
    const towerBaseY = 850;
    const towerW = 100;
    const towerH = 300; 
    const floors = 12;
    const winsX = 4;
    
    const hasPower = energyRef.current > 1;

    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(stationX + 40, stationY + 20); 
    ctx.bezierCurveTo(stationX + 100, stationY + 20, towerX - towerW/2 - 50, towerBaseY - 100, towerX - towerW/2, towerBaseY - 150); 
    ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#334155'; ctx.fillRect(towerX - towerW/2 - 2, towerBaseY - 155, 4, 10);

    const bGrad = ctx.createLinearGradient(towerX - towerW/2, towerBaseY - towerH, towerX + towerW/2, towerBaseY);
    bGrad.addColorStop(0, '#1e293b'); bGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bGrad; ctx.fillRect(towerX - towerW/2, towerBaseY - towerH, towerW, towerH);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(towerX - towerW/2, towerBaseY - towerH, 5, towerH);

    ctx.fillStyle = '#0f172a'; ctx.fillRect(towerX - 20, towerBaseY - towerH - 15, 40, 15); ctx.fillRect(towerX + 10, towerBaseY - towerH - 25, 10, 25);
    
    if (hasPower) {
        const blink = Math.sin(frame * 0.1) > 0;
        ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
        ctx.beginPath(); ctx.arc(towerX + 15, towerBaseY - towerH - 25, 3, 0, Math.PI*2); ctx.fill();
        if (blink) { ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0; }
    }

    const winW = 14; const winH = 16;
    const gapX = (towerW - (winsX * winW)) / (winsX + 1);
    const gapY = (towerH - (floors * winH)) / (floors + 1);
    
    for (let f = 0; f < floors; f++) {
        for (let w = 0; w < winsX; w++) {
            const wx = (towerX - towerW/2) + gapX + (w * (winW + gapX));
            const wy = (towerBaseY - towerH) + gapY + (f * (winH + gapY)) + 10; 
            const tenantActive = ((f * 7 + w * 13) % 5) !== 0; 
            
            if (hasPower && tenantActive) {
                const isWarm = ((f + w) % 2 === 0);
                ctx.fillStyle = isWarm ? '#fef3c7' : '#e0f2fe'; 
                if (Math.random() > 0.995) ctx.fillStyle = '#94a3b8'; 
                ctx.shadowColor = isWarm ? '#fbbf24' : '#bae6fd'; ctx.shadowBlur = 8;
            } else {
                ctx.fillStyle = '#1e293b'; ctx.shadowBlur = 0;
            }
            ctx.fillRect(wx, wy, winW, winH); ctx.shadowBlur = 0;
        }
    }

    // --- HUD Overlay for Physics Status ---
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(260, 150, 480, 70, 30);
    ctx.fill();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // UPDATED FONT SIZE: 40px base to ensure it renders at least ~16px on mobile (0.4 scale)
    ctx.font = 'bold 40px monospace';
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, 500, 185);

    if (windSpeed > 80) {
       ctx.font = '50px sans-serif';
       ctx.fillText('⚠️', 300, 190);
       ctx.fillText('⚠️', 700, 190);
    }
  }, [windSpeed]); 

  // --- Game Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
        let chargeRate = 0;
        if (windSpeed >= CUT_IN_THRESHOLD && windSpeed <= CUT_OUT_THRESHOLD) {
            chargeRate += (windSpeed / 100) * 0.6; 
        }
        const consumptionRate = 0.15; 
        chargeRate -= consumptionRate;

        setStoredEnergy(prev => {
            const next = prev + chargeRate;
            return Math.max(0, Math.min(100, next));
        });
    }, 50); 

    return () => clearInterval(interval);
  }, [windSpeed]);

  return (
    <>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        <SimulationCanvas draw={draw} isAnimated={true} />
        
        {/* IMPROVED OVERLAY: High contrast, smaller text for mobile */}
         <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-2 pointer-events-none">
            {/* Input Wind */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-start min-w-[100px]">
                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <Wind size={10} className={windSpeed > 0 ? "text-sky-400" : "text-slate-600"} />
                    Input
                </div>
                <div className="text-lg md:text-xl font-mono font-bold text-white leading-none">
                    {windSpeed} <span className="text-[10px] text-slate-500 font-sans">MPH</span>
                </div>
            </div>

            {/* Battery Level */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[100px]">
                 <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    Battery
                    <Zap size={10} className={storedEnergy > 0 ? "text-green-400" : "text-slate-600"} fill="currentColor"/>
                </div>
                <div className="text-lg md:text-xl font-mono font-bold text-white leading-none">
                    {Math.round(storedEnergy)}<span className="text-xs text-slate-500">%</span>
                </div>
            </div>
        </div>
      </div>

      <ControlPanel 
        title="Wind Energy & Limits" 
        description="Turbines power a local grid (City Tower). They need enough wind to generate surplus energy, but must stop in storms."
      >
        <div className="space-y-4">
            <div className="w-full">
                <Slider 
                label="Wind Speed (MPH)" 
                value={windSpeed} 
                onChange={setWindSpeed} 
                labels={['Calm', 'Hurricane']}
                />
            </div>
            
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex justify-between items-center">
                 <div className="text-xs text-slate-400">
                    <span className="block mb-1">Observation Tips:</span>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Calm: Battery drains</li>
                        <li>&gt;{CUT_OUT_THRESHOLD} MPH: Safety Brake</li>
                    </ul>
                 </div>
                 <div className="w-32">
                    <ActionButton 
                        label="Drain" 
                        variant="secondary"
                        onClick={() => setStoredEnergy(0)}
                        icon={<RefreshCcw size={16}/>}
                    />
                 </div>
            </div>
        </div>
      </ControlPanel>
    </>
  );
};

export default WindmillSimulation;