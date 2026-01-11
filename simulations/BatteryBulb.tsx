import React, { useState, useCallback, useMemo } from 'react';
import SimulationCanvas from '../components/SimulationCanvas';
import ControlPanel from '../components/ControlPanel';
import { Stepper, Toggle } from '../components/ui/Controls';
import { COLORS } from '../types';
import { Battery, Zap } from 'lucide-react';

const BatteryBulbSimulation: React.FC = () => {
  // --- State ---
  const [batteryCount, setBatteryCount] = useState<number>(1);
  const [bulbCount, setBulbCount] = useState<number>(1);
  const [switchClosed, setSwitchClosed] = useState<boolean>(false);

  // --- Logic ---
  const brightness = useMemo(() => {
    if (!switchClosed || batteryCount === 0) return 0;
    if (batteryCount === 3 && bulbCount === 2) {
      return 0.66;
    }
    const energyPerBattery = 0.33;
    const totalInputEnergy = batteryCount * energyPerBattery;
    const energyPerBulb = totalInputEnergy / bulbCount;
    return energyPerBulb;
  }, [batteryCount, bulbCount, switchClosed]);

  // --- Drawing Logic ---
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    const scale = Math.min(width, height) / 1000;
    const offsetX = (width - 1000 * scale) / 2;
    const offsetY = (height - 1000 * scale) / 2;

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, 1000, 1000);

    const leftX = 200;
    const rightX = 800;
    const topY = 200;
    const bottomY = 800;

    const drawWireSegment = (x1: number, y1: number, x2: number, y2: number) => {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineWidth = 16; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineWidth = 10; ctx.strokeStyle = brightness > 0 ? '#f59e0b' : '#475569'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.stroke();
    };

    const drawConnectionNode = (x: number, y: number) => {
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.stroke();
    };

    drawWireSegment(leftX, topY, rightX, topY);
    drawWireSegment(rightX, topY, rightX, bottomY);
    drawWireSegment(leftX, topY, leftX, bottomY);
    
    if (switchClosed) {
        drawWireSegment(leftX, bottomY, rightX, bottomY);
    } else {
        drawWireSegment(leftX, bottomY, 450, bottomY);
        drawWireSegment(550, bottomY, rightX, bottomY);
    }

    drawConnectionNode(leftX, topY);
    drawConnectionNode(rightX, topY);
    drawConnectionNode(rightX, bottomY);
    drawConnectionNode(leftX, bottomY);

    if (brightness > 0) {
        const speed = (brightness * 0.8) + 0.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(leftX, topY);
        ctx.lineTo(rightX, topY);
        ctx.lineTo(rightX, bottomY);
        if (switchClosed) ctx.lineTo(leftX, bottomY);
        ctx.lineTo(leftX, topY);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 30]);
        ctx.lineDashOffset = -frame * (speed * 15);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    const swX = 500;
    const swY = bottomY;
    ctx.save();
    ctx.translate(swX, swY);
    ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.roundRect(-70, -20, 140, 40, 10); ctx.fill();
    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2; ctx.stroke();

    const drawTerminal = (x: number) => {
        ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(x, 0, 8, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x-5, 0); ctx.lineTo(x+5, 0); ctx.stroke();
    };
    drawTerminal(-50); drawTerminal(50);

    ctx.save();
    ctx.translate(-50, 0);
    const angle = switchClosed ? 0 : -Math.PI / 4;
    ctx.rotate(angle);
    ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, -6, 110, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(0, -6, 110, 4);
    ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.roundRect(100, -12, 15, 24, 4); ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(switchClosed ? 'ON' : 'OFF', 0, 45);
    ctx.restore();

    const batteryWidth = 100;
    const batteryHeight = 160;
    const batSpacing = 200;
    const startYBat = 500 - ((batteryCount - 1) * batSpacing) / 2;

    for (let i = 0; i < batteryCount; i++) {
        const x = leftX;
        const y = startYBat + i * batSpacing;
        ctx.save();
        ctx.translate(x, y);
        const grad = ctx.createLinearGradient(-batteryWidth/2, 0, batteryWidth/2, 0);
        grad.addColorStop(0, '#334155'); grad.addColorStop(0.2, '#475569'); grad.addColorStop(0.5, '#334155'); grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad; ctx.fillRect(-batteryWidth/2, -batteryHeight/2, batteryWidth, batteryHeight);
        ctx.fillStyle = '#0ea5e9'; ctx.fillRect(-batteryWidth/2, -20, batteryWidth, 40);
        ctx.fillStyle = 'white'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('VOLT', 0, 0);
        ctx.font = 'bold 20px monospace'; ctx.fillStyle = '#94a3b8'; ctx.fillText('1.5V', 0, 50);
        
        const nubW = 40; const nubH = 15;
        const nubGrad = ctx.createLinearGradient(-nubW/2, 0, nubW/2, 0);
        nubGrad.addColorStop(0, '#94a3b8'); nubGrad.addColorStop(0.5, '#e2e8f0'); nubGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = nubGrad; ctx.fillRect(-nubW/2, -batteryHeight/2 - nubH, nubW, nubH);
        ctx.fillStyle = '#64748b'; ctx.fillRect(-batteryWidth/2 + 10, batteryHeight/2, batteryWidth - 20, 5);
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font = 'bold 40px sans-serif';
        ctx.fillText('+', 0, -batteryHeight/4); ctx.fillText('-', 0, batteryHeight/4 + 10);
        ctx.restore();
    }
    
    if (batteryCount === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(leftX - 50, 500 - 80, 100, 160);
        ctx.textAlign = 'center'; ctx.font = 'italic 16px Inter'; ctx.fillText('No Source', leftX, 500); ctx.setLineDash([]);
    }

    const bulbSpacing = 200;
    const startYBulb = 500 - ((bulbCount - 1) * bulbSpacing) / 2;
    
    for (let i = 0; i < bulbCount; i++) {
        const x = rightX;
        const y = startYBulb + i * bulbSpacing;
        ctx.save();
        ctx.translate(x, y);

        if (brightness > 0) {
            const glowRadius = 100 + (brightness * 250); 
            const alpha = Math.min(1, Math.pow(brightness, 1.2) * 0.85);
            const glowGrad = ctx.createRadialGradient(0, 0, 40, 0, 0, glowRadius);
            if (brightness < 0.25) {
                glowGrad.addColorStop(0, `rgba(234, 88, 12, ${alpha * 0.6})`); glowGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
            } else if (brightness < 0.6) {
                 glowGrad.addColorStop(0, `rgba(253, 224, 71, ${alpha})`); glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
            } else {
                 glowGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`); glowGrad.addColorStop(0.2, `rgba(253, 224, 71, ${alpha})`); glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
            }
            ctx.fillStyle = glowGrad; ctx.beginPath(); ctx.arc(0, 0, glowRadius, 0, Math.PI*2); ctx.fill();
            if (brightness > 0.7) {
                const coreGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
                coreGrad.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.9})`); coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = coreGrad; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI*2); ctx.fill();
            }
        }

        const baseW = 50; const baseH = 50;
        const baseGrad = ctx.createLinearGradient(-baseW/2, 0, baseW/2, 0);
        baseGrad.addColorStop(0, '#b45309'); baseGrad.addColorStop(0.3, '#fcd34d'); baseGrad.addColorStop(0.6, '#b45309'); baseGrad.addColorStop(1, '#78350f'); 
        ctx.fillStyle = baseGrad; ctx.fillRect(-baseW/2, 40, baseW, baseH);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-baseW/2, 55); ctx.lineTo(baseW/2, 50); ctx.moveTo(-baseW/2, 70); ctx.lineTo(baseW/2, 65); ctx.stroke();
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.moveTo(-baseW/2 + 5, 90); ctx.lineTo(baseW/2 - 5, 90); ctx.lineTo(0, 100); ctx.fill();

        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI*2); 
        const glassGrad = ctx.createRadialGradient(-20, -20, 0, 0, 0, 60);
        if (brightness > 0) {
             if (brightness < 0.25) { glassGrad.addColorStop(0, 'rgba(253, 186, 116, 0.4)'); glassGrad.addColorStop(1, 'rgba(234, 88, 12, 0.3)'); } 
             else if (brightness < 0.6) { glassGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)'); glassGrad.addColorStop(1, 'rgba(234, 179, 8, 0.7)'); } 
             else { glassGrad.addColorStop(0, '#ffffff'); glassGrad.addColorStop(0.6, '#fef08a'); glassGrad.addColorStop(1, '#facc15'); }
        } else {
             glassGrad.addColorStop(0, 'rgba(255,255,255,0.1)'); glassGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
        }
        ctx.fillStyle = glassGrad; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.stroke();
        if (brightness < 0.8) { ctx.beginPath(); ctx.arc(-25, -25, 10, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill(); }

        ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-10, 40); ctx.lineTo(-10, 0); ctx.moveTo(10, 40); ctx.lineTo(10, 0); ctx.stroke();
        ctx.strokeStyle = brightness > 0 ? '#fff' : '#64748b'; ctx.lineWidth = brightness > 0 ? (2 + brightness * 3) : 1; 
        if (brightness > 0) {
             if (brightness < 0.25) { ctx.strokeStyle = '#ef4444'; ctx.shadowColor = '#dc2626'; ctx.shadowBlur = 10; } 
             else if (brightness < 0.6) { ctx.strokeStyle = '#fcd34d'; ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 30; } 
             else { ctx.strokeStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 60; }
        } else { ctx.shadowBlur = 0; }
        ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-5, -10); ctx.lineTo(0, 0); ctx.lineTo(5, -10); ctx.lineTo(10, 0); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
  }, [batteryCount, bulbCount, switchClosed, brightness]);

  return (
    <>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        <SimulationCanvas draw={draw} isAnimated={true} />
        
        {/* IMPROVED OVERLAY: Smaller cards */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start gap-4 pointer-events-none">
            {/* Source Card */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-start min-w-[100px]">
                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <Battery size={10} className={batteryCount > 0 ? "text-brand-400" : "text-slate-600"} />
                    Source
                </div>
                <div className="text-lg md:text-xl font-mono font-bold text-white leading-none">
                    {batteryCount > 0 ? `${batteryCount}x` : '0'} <span className="text-[10px] text-slate-500 font-sans">BATT</span>
                </div>
            </div>

            {/* Effect Card */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[100px]">
                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    Output
                    <Zap size={10} className={brightness > 0 ? "text-yellow-400" : "text-slate-600"} fill="currentColor" />
                </div>
                <div className="text-lg md:text-xl font-mono font-bold text-white leading-none flex items-baseline">
                     {Math.round(brightness * 100)}<span className="text-xs text-slate-500">%</span>
                </div>
            </div>
        </div>
      </div>

      <ControlPanel 
        title="Battery & Bulb" 
        description="Connect the energy source to the receiver. Observe how sharing energy affects intensity."
      >
        <Stepper 
          label="Batteries (Source)" 
          value={batteryCount} 
          min={0} 
          max={3} 
          onChange={setBatteryCount} 
        />
        <Toggle 
          label="Circuit Switch" 
          isOn={switchClosed} 
          onToggle={() => setSwitchClosed(!switchClosed)} 
        />
        <Stepper 
          label="Bulbs (Receiver)" 
          value={bulbCount} 
          min={1} 
          max={3} 
          onChange={setBulbCount} 
        />
      </ControlPanel>
    </>
  );
};

export default BatteryBulbSimulation;