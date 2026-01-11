import React, { useState, useCallback, useMemo } from 'react';
import SimulationCanvas from '../components/SimulationCanvas';
import ControlPanel from '../components/ControlPanel';
import { Slider, ActionButton } from '../components/ui/Controls';
import { Sun, Moon, CloudSun, Fan, Clock } from 'lucide-react';

const SolarPanelSimulation: React.FC = () => {
  // --- State ---
  const [timeOfDay, setTimeOfDay] = useState<number>(12); // 0 to 24 hours
  const [cloudDensity, setCloudDensity] = useState<number>(0); // 0 to 100%

  // --- Logic ---
  const { sunPosition, sunVisible, energyOutput, sunHeight } = useMemo(() => {
    // 1. Sun Logic
    // Day is 6am to 6pm
    let isDay = timeOfDay > 5.5 && timeOfDay < 18.5;
    
    // 0.0 (6am) -> 0.5 (Noon) -> 1.0 (6pm)
    const rawProgress = (timeOfDay - 6) / 12; 
    const dayProgress = Math.max(0, Math.min(1, rawProgress));

    // Calculate generic height for colors (0 = horizon, 1 = zenith)
    const height = isDay ? Math.sin(dayProgress * Math.PI) : 0;

    // 2. Efficiency
    const angleEff = height; // Simplified: max at noon
    const cloudEff = 1 - (cloudDensity / 100) * 0.9;
    const totalOutput = Math.max(0, angleEff * cloudEff);

    return { 
        sunPosition: dayProgress, 
        sunVisible: isDay, 
        energyOutput: totalOutput,
        sunHeight: height
    };
  }, [timeOfDay, cloudDensity]);


  // --- Drawing Logic ---
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    if (width <= 0 || height <= 0) return;

    // Responsive Scaling
    const virtualWidth = 1000;
    const scale = width / virtualWidth;
    const virtualHeight = height / scale;

    ctx.scale(scale, scale);

    // --- Layout Anchors ---
    const centerX = virtualWidth / 2;
    const groundY = virtualHeight - 120;
    
    // --- 1. Realistic Sky Rendering ---
    const drawSky = () => {
        const grad = ctx.createLinearGradient(0, 0, 0, virtualHeight);
        
        if (sunVisible) {
            if (sunHeight < 0.2) {
                // Sunrise/Sunset (Golden Hour)
                grad.addColorStop(0, '#3b82f6'); // Zenith Blue
                grad.addColorStop(0.5, '#60a5fa'); 
                grad.addColorStop(0.8, '#fb923c'); // Orange
                grad.addColorStop(1, '#facc15'); // Yellow horizon
            } else {
                // Day (Blue Sky)
                // Adjust saturation based on height
                grad.addColorStop(0, '#0284c7'); // Deep Blue
                grad.addColorStop(1, '#bae6fd'); // Light Blue
            }
        } else {
            // Night
            grad.addColorStop(0, '#020617'); // Deep Space
            grad.addColorStop(0.6, '#0f172a'); 
            grad.addColorStop(1, '#1e293b'); // Horizon Glow
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, virtualWidth, virtualHeight);

        // Stars (fade in at night)
        if (!sunVisible || sunHeight < 0.1) {
            const opacity = !sunVisible ? 1 : 1 - (sunHeight * 10);
            ctx.fillStyle = 'white';
            const seed = 123; // deterministic stars
            for(let i=0; i<80; i++) {
                const x = (Math.sin(i * seed) * 10000) % virtualWidth;
                const y = (Math.cos(i * seed * 0.5) * 10000) % (groundY * 0.8);
                const s = (i % 3 === 0) ? 1.5 : 1;
                ctx.globalAlpha = (Math.random() * 0.5 + 0.3) * opacity;
                ctx.beginPath(); ctx.arc(Math.abs(x), Math.abs(y), s, 0, Math.PI*2); ctx.fill();
            }
            ctx.globalAlpha = 1.0;
        }
    };
    drawSky();

    // --- 2. Parallax Landscape (Distant Mountains) ---
    const drawMountains = () => {
        // Far Mountains
        ctx.fillStyle = sunVisible ? 'rgba(30, 58, 138, 0.3)' : 'rgba(2, 6, 23, 0.5)';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(0, groundY - 100);
        ctx.lineTo(200, groundY - 250);
        ctx.lineTo(450, groundY - 80);
        ctx.lineTo(700, groundY - 180);
        ctx.lineTo(1000, groundY - 50);
        ctx.lineTo(1000, groundY);
        ctx.fill();
        
        // Mist layer
        const mistGrad = ctx.createLinearGradient(0, groundY - 50, 0, groundY);
        mistGrad.addColorStop(0, 'rgba(255,255,255,0)');
        mistGrad.addColorStop(1, sunVisible ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.4)');
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, groundY - 50, virtualWidth, 50);
    };
    drawMountains();


    // --- 3. Sun (Detailed) ---
    let sunX = 0, sunY = 0;
    if (sunVisible) {
        // Path
        const skyPaddingTop = 100;
        const availableSkyHeight = groundY - skyPaddingTop;
        const maxSunRadius = Math.min(virtualWidth * 0.45, availableSkyHeight * 0.9);
        const arcCenterY = groundY + (maxSunRadius * 0.3); 
        const sunAngle = Math.PI * (1 - sunPosition);
        
        sunX = centerX + Math.cos(sunAngle) * maxSunRadius;
        sunY = arcCenterY - Math.sin(sunAngle) * maxSunRadius;

        // Glow (Corona)
        const coronaRadius = 150 + Math.sin(frame * 0.05) * 10;
        const sunGrad = ctx.createRadialGradient(sunX, sunY, 25, sunX, sunY, coronaRadius);
        sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.9)'); 
        sunGrad.addColorStop(0.2, 'rgba(253, 186, 116, 0.4)'); 
        sunGrad.addColorStop(1, 'rgba(253, 186, 116, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath(); ctx.arc(sunX, sunY, coronaRadius, 0, Math.PI*2); ctx.fill();

        // Core
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#fffbeb'; // bright white-yellow
        ctx.beginPath(); ctx.arc(sunX, sunY, 35, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // "Photons" (Particles moving to panel)
        // Only visible if producing energy
        if (energyOutput > 0) {
            const panelX = centerX;
            const panelY = groundY - 40;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            
            // Generate deterministic pseudo-random streaks based on frame
            for(let i=0; i<5; i++) {
                const t = (frame + i * 20) % 100 / 100;
                const lx = sunX + (panelX - sunX) * t;
                const ly = sunY + (panelY - sunY) * t;
                
                // Jitter
                const jx = Math.sin(t * 10 + i) * 20; 
                
                ctx.beginPath();
                ctx.moveTo(lx + jx, ly);
                ctx.lineTo(lx + jx - (panelX - sunX)*0.05, ly - (panelY - sunY)*0.05);
                ctx.stroke();
            }
        }
    } else {
        // Moon
        sunX = virtualWidth * 0.8;
        sunY = 150;
        ctx.fillStyle = '#f8fafc';
        ctx.shadowColor = '#e2e8f0';
        ctx.shadowBlur = 20;
        ctx.beginPath(); ctx.arc(sunX, sunY, 30, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
        // Craters
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(sunX - 10, sunY + 5, 8, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(sunX + 12, sunY - 8, 5, 0, Math.PI*2); ctx.fill();
    }


    // --- 4. Ground (Textured) ---
    const drawGround = () => {
        // Hill gradient
        const gGrad = ctx.createLinearGradient(0, groundY, 0, virtualHeight);
        gGrad.addColorStop(0, sunVisible ? '#15803d' : '#064e3b'); // Grass Green or Night Green
        gGrad.addColorStop(1, sunVisible ? '#14532d' : '#022c22'); 
        
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.bezierCurveTo(virtualWidth * 0.3, groundY - 30, virtualWidth * 0.7, groundY - 30, virtualWidth, groundY);
        ctx.lineTo(virtualWidth, virtualHeight);
        ctx.lineTo(0, virtualHeight);
        ctx.fill();

        // Grass blades (simplified texture)
        ctx.strokeStyle = sunVisible ? '#16a34a' : '#065f46';
        ctx.lineWidth = 2;
        // Deterministic grass
        for (let i = 0; i < virtualWidth; i += 15) {
            // Only draw near the top edge
            const yBase = groundY - 5 + Math.sin(i*0.02) * 20; 
            if (yBase > groundY + 20) continue; // cull if too low

            const h = 5 + (Math.sin(i * 321) + 1) * 3;
            ctx.beginPath();
            ctx.moveTo(i, yBase);
            ctx.lineTo(i + (Math.sin(frame * 0.05 + i) * 2), yBase - h);
            ctx.stroke();
        }
    };
    drawGround();


    // --- 5. Objects ---
    
    // Wire: Panel to Fan
    const fanX = centerX + 300;
    const fanY = groundY + 30;
    const panelY = groundY - 35;
    
    // Draw Wire
    ctx.beginPath();
    ctx.moveTo(centerX, panelY + 60); // Base of panel
    ctx.bezierCurveTo(centerX, groundY + 10, centerX + 100, groundY + 20, fanX, groundY + 20); // Along ground
    ctx.lineTo(fanX, fanY - 80); // Up to fan motor
    
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#334155'; // Black insulation
    ctx.stroke();
    
    // Energy Pulse (Electrons)
    if (energyOutput > 0) {
        const offset = -(frame * (energyOutput * 10)) % 20;
        ctx.lineDashOffset = offset;
        ctx.setLineDash([10, 30]);
        ctx.lineWidth = 3;
        ctx.strokeStyle = energyOutput > 0.8 ? '#facc15' : '#fbbf24'; // Yellow pulse
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // -- Solar Panel (Realistic) --
    ctx.save();
    ctx.translate(centerX, panelY);
    
    // Stand legs
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-40, 60); ctx.lineTo(-50, 90); ctx.lineTo(50, 90); ctx.lineTo(40, 60);
    ctx.fill();
    ctx.fillStyle = '#64748b'; // Rear support
    ctx.fillRect(-5, 0, 10, 80);

    // Panel Tilt: We'll fake a 3D perspective
    // Main Board
    ctx.rotate(0.1); // Slight tilt visual

    // Frame (Aluminum)
    const panelW = 280;
    const panelH = 160;
    const border = 8;
    
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 10;
    
    // Frame Gradient
    const frameGrad = ctx.createLinearGradient(-panelW/2, -panelH/2, panelW/2, panelH/2);
    frameGrad.addColorStop(0, '#cbd5e1');
    frameGrad.addColorStop(0.5, '#94a3b8');
    frameGrad.addColorStop(1, '#475569');
    
    ctx.fillStyle = frameGrad;
    ctx.roundRect(-panelW/2, -panelH/2, panelW, panelH, 4);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // Cells Area
    const cellW = (panelW - border*2);
    const cellH = (panelH - border*2);
    
    // Cell Color (Changes with light)
    const baseCellColor = sunVisible ? '#172554' : '#020617'; // Blue-950 or Black
    ctx.fillStyle = baseCellColor;
    ctx.fillRect(-cellW/2, -cellH/2, cellW, cellH);

    // Grid lines (White silver)
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    // Horizontal
    for(let i=1; i<4; i++) {
        const y = -cellH/2 + (cellH/4)*i;
        ctx.beginPath(); ctx.moveTo(-cellW/2, y); ctx.lineTo(cellW/2, y); ctx.stroke();
    }
    // Vertical
    for(let i=1; i<6; i++) {
        const x = -cellW/2 + (cellW/6)*i;
        ctx.beginPath(); ctx.moveTo(x, -cellH/2); ctx.lineTo(x, cellH/2); ctx.stroke();
    }

    // Reflection / Glass Sheen
    // Linear gradient overlay
    const sheenGrad = ctx.createLinearGradient(-panelW/2, -panelH/2, panelW/2, panelH/2);
    sheenGrad.addColorStop(0, 'rgba(255,255,255,0.1)');
    sheenGrad.addColorStop(0.4, 'rgba(255,255,255,0)');
    sheenGrad.addColorStop(0.6, 'rgba(255,255,255,0.2)'); // Glint
    sheenGrad.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = sheenGrad;
    ctx.fillRect(-cellW/2, -cellH/2, cellW, cellH);
    
    ctx.restore();


    // -- Industrial Fan (Realistic) --
    ctx.save();
    ctx.translate(fanX, fanY);

    // Stand Base (Circular, metallic)
    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.ellipse(0, 0, 40, 10, 0, 0, Math.PI*2); ctx.fill();
    // Stand Pole
    ctx.fillStyle = '#64748b'; 
    ctx.fillRect(-4, -100, 8, 100);
    // Motor Housing
    ctx.translate(0, -100);
    ctx.fillStyle = '#334155';
    ctx.beginPath(); ctx.roundRect(-20, -20, 40, 40, 10); ctx.fill();
    
    // Fan Cage (Simplified to outer ring)
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 65, 0, Math.PI*2); ctx.stroke();

    // Blades Animation
    const speed = energyOutput * 40; // Max speed
    const isFast = speed > 15;
    
    ctx.rotate(frame * speed * 0.05);

    // If fast, draw Motion Blur Disc
    if (isFast) {
        ctx.fillStyle = `rgba(200, 220, 240, ${Math.min(0.4, (speed-15)/40)})`;
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI*2); ctx.fill();
    }

    // Draw 3 Blades
    // Opacity drops if spinning super fast to simulate blur
    ctx.fillStyle = `rgba(226, 232, 240, ${isFast ? 0.6 : 1})`; 
    for(let i=0; i<3; i++) {
        ctx.rotate((Math.PI*2)/3);
        ctx.beginPath();
        // Aerodynamic shape
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(20, -10, 40, -10, 55, 0); // Leading edge
        ctx.bezierCurveTo(40, 20, 20, 15, 0, 0); // Trailing edge
        ctx.fill();
        
        // Blade crease
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(45, 5); ctx.stroke();
    }

    // Center Cap
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();

    ctx.restore();


    // --- 6. Fluffy Clouds (Layered) ---
    const drawCloud = (cx: number, cy: number, scale: number, density: number) => {
        if (density <= 0) return;
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        
        const opacity = Math.min(0.95, density / 80);
        
        // Base Shadow Layer (Darker)
        ctx.fillStyle = `rgba(30, 41, 59, ${opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(10, 10, 35, 0, Math.PI*2);
        ctx.arc(50, 15, 30, 0, Math.PI*2);
        ctx.fill();

        // Main White Layer
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.beginPath();
        // Combine multiple puffs
        ctx.arc(0, 0, 40, 0, Math.PI*2);      // Left
        ctx.arc(40, -10, 50, 0, Math.PI*2);   // Center Top
        ctx.arc(80, 5, 40, 0, Math.PI*2);     // Right
        ctx.arc(40, 20, 35, 0, Math.PI*2);    // Center Bottom
        ctx.fill();
        
        ctx.restore();
    };

    if (cloudDensity > 0) {
        // Draw a few overlapping clouds with parallax movement
        const speed = 0.5;
        // Cloud 1
        const x1 = ((frame * speed) % (virtualWidth + 300)) - 150;
        drawCloud(x1, 150, 1.2, cloudDensity);
        
        // Cloud 2 (offset)
        const x2 = ((frame * speed * 0.8 + 500) % (virtualWidth + 300)) - 150;
        drawCloud(x2, 220, 0.9, cloudDensity);

        // Cloud 3 (dense overlap)
        if (cloudDensity > 50) {
             const x3 = ((frame * speed * 1.2 + 200) % (virtualWidth + 300)) - 150;
             drawCloud(x3, 100, 1.5, cloudDensity);
        }
    }


  }, [sunPosition, sunVisible, energyOutput, sunHeight, cloudDensity]);

  // Helper for formatting time
  const formatTime = (val: number) => {
      const h = Math.floor(val);
      const m = Math.floor((val % 1) * 60);
      const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  return (
    <>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        <SimulationCanvas draw={draw} isAnimated={true} />
        
        {/* --- HTML HUD Overlay (Pill Style) --- */}
        <div className="absolute top-4 left-4 right-4 flex flex-row justify-between items-start pointer-events-none">
            
            {/* Input Meter (Sunlight) */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-start min-w-[100px]">
                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    <Clock size={10} className={sunVisible ? "text-orange-400" : "text-blue-400"} />
                    Input
                </div>
                <div className="text-lg font-mono font-bold text-white flex items-center">
                     {formatTime(timeOfDay)}
                </div>
                {cloudDensity > 20 && (
                     <div className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                         <CloudSun size={10} />
                         {cloudDensity > 70 ? 'Overcast' : 'Cloudy'}
                     </div>
                )}
            </div>

            {/* Output Meter (Fan Speed) */}
            <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[100px]">
                <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                    Fan Speed
                    <Fan size={10} className={energyOutput > 0 ? "text-cyan-400 animate-spin" : "text-slate-600"} />
                </div>
                <div className="text-2xl font-mono font-bold text-white flex items-baseline gap-1">
                    <span className={energyOutput > 0.8 ? 'text-green-400' : energyOutput > 0.2 ? 'text-cyan-400' : 'text-slate-400'}>
                        {Math.round(energyOutput * 100)}
                    </span>
                    <span className="text-xs text-slate-500">%</span>
                </div>
            </div>
        </div>
      </div>

      <ControlPanel 
        title="Solar Panel" 
        description="Sunlight converts to electricity to power the fan. Time of day and weather affect efficiency."
      >
        <div className="space-y-4">
            {/* Time Control Group */}
            <div className="space-y-3">
                <Slider 
                    label="Time" 
                    value={timeOfDay} 
                    min={0}
                    max={23.9}
                    step={0.1}
                    onChange={setTimeOfDay}
                    formatValue={formatTime}
                />
                
                {/* Quick Jumps */}
                <div className="grid grid-cols-3 gap-2">
                    <ActionButton 
                        label="Sunrise" 
                        size="sm"
                        variant={timeOfDay >= 5 && timeOfDay < 7 ? 'primary' : 'secondary'}
                        onClick={() => setTimeOfDay(6)}
                        icon={<CloudSun size={14}/>}
                    />
                    <ActionButton 
                        label="Noon" 
                        size="sm"
                        variant={timeOfDay >= 11 && timeOfDay < 13 ? 'primary' : 'secondary'}
                        onClick={() => setTimeOfDay(12)}
                        icon={<Sun size={14}/>}
                    />
                    <ActionButton 
                        label="Night" 
                        size="sm"
                        variant={timeOfDay >= 20 || timeOfDay < 4 ? 'primary' : 'secondary'}
                        onClick={() => setTimeOfDay(22)}
                        icon={<Moon size={14}/>}
                    />
                </div>
            </div>

            {/* Weather Control */}
            <Slider 
                label="Clouds" 
                value={cloudDensity} 
                onChange={setCloudDensity} 
                labels={['Clear', 'Storm']}
            />
        </div>
      </ControlPanel>
    </>
  );
};

export default SolarPanelSimulation;