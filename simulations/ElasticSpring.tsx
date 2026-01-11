import React, { useState, useCallback, useRef } from 'react';
import SimulationCanvas from '../components/SimulationCanvas';
import ControlPanel from '../components/ControlPanel';
import { Slider, ActionButton, Toggle } from '../components/ui/Controls';
import { Play, RotateCcw, FastForward, MoveHorizontal } from 'lucide-react';

const ElasticSpringSimulation: React.FC = () => {
  // State for UI
  const [compressionInput, setCompressionInput] = useState<number>(0);
  const [isStiff, setIsStiff] = useState<boolean>(false);
  const [simulationState, setSimulationState] = useState<'IDLE' | 'RUNNING' | 'FINISHED'>('IDLE');

  // DOM Refs for High Performance HUD Updates
  const epeValueRef = useRef<HTMLSpanElement>(null);
  const keValueRef = useRef<HTMLSpanElement>(null);
  const distValueRef = useRef<HTMLSpanElement>(null);
  const speedValueRef = useRef<HTMLSpanElement>(null);

  // Physics State
  const phys = useRef({
    t: 0,
    ballDisp: 0,      // Current displacement (pixels)
    startDisp: 0,     // Starting displacement for distance calc
    springDisp: 0,    // Spring displacement
    velocity: 0,      // Ball velocity
    cameraX: 0,       // Camera pan
    
    // Constants
    mass: 2,
    k_stiff: 1.5,
    k_loose: 0.5,
    friction: 0.99,
    
    springVel: 0
  });

  const MAX_COMPRESSION_PIXELS = 120;
  const PIXELS_PER_METER = 100;

  // Reset Logic
  const reset = () => {
    setSimulationState('IDLE');
    setCompressionInput(0);
    phys.current.ballDisp = 0;
    phys.current.springDisp = 0;
    phys.current.velocity = 0;
    phys.current.springVel = 0;
    phys.current.cameraX = 0;
    phys.current.startDisp = 0;
  };

  const fire = () => {
    if (compressionInput < 5) return;
    setSimulationState('RUNNING');
    
    const dist = (compressionInput / 100) * MAX_COMPRESSION_PIXELS;
    
    phys.current.ballDisp = -dist; 
    phys.current.startDisp = -dist; // Record start point
    phys.current.springDisp = -dist;
    phys.current.velocity = 0;
  };

  // --- Drawing Function ---
    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const virtualHeight = 500;
    const scale = height / virtualHeight;
    const virtualWidth = width / scale;
    
    ctx.scale(scale, scale);

    const p = phys.current;
    const k = isStiff ? p.k_stiff : p.k_loose;

    // 2. Physics Update Step
    if (simulationState === 'IDLE') {
        const targetDisp = -(compressionInput / 100) * MAX_COMPRESSION_PIXELS;
        p.ballDisp += (targetDisp - p.ballDisp) * 0.2;
        p.springDisp = p.ballDisp;
        p.velocity = 0;
    } 
    else if (simulationState === 'RUNNING') {
        if (p.ballDisp < 0) {
            // Attached
            const force = -k * p.ballDisp;
            const accel = force / p.mass;
            p.velocity += accel;
            p.ballDisp += p.velocity;
            p.springDisp = p.ballDisp;

            if (p.ballDisp >= 0) {
                p.ballDisp = 0; 
            }
        } else {
            // Detached
            p.ballDisp += p.velocity;
            p.velocity *= p.friction;
            if (Math.abs(p.velocity) < 0.1) p.velocity = 0;

            const sForce = -k * p.springDisp;
            p.springVel += (sForce / 0.5); 
            p.springVel *= 0.85;
            p.springDisp += p.springVel;
        }
    }

    // 3. Camera
    const worldRestX = 400;
    const ballWorldX = worldRestX + p.ballDisp;
    let targetCam = 0;
    if (ballWorldX > virtualWidth * 0.5) {
        targetCam = ballWorldX - virtualWidth * 0.5;
    }
    p.cameraX += (targetCam - p.cameraX) * 0.1;

    ctx.save();
    ctx.translate(-p.cameraX, 0);

    // --- 4. Render Scene ---
    const groundY = 380;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(p.cameraX, 0, virtualWidth, virtualHeight);

    // Spotlight
    const wallGrad = ctx.createRadialGradient(worldRestX, groundY - 200, 100, worldRestX, groundY - 100, 800);
    wallGrad.addColorStop(0, '#1e293b');
    wallGrad.addColorStop(1, '#020617');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(p.cameraX - 100, 0, virtualWidth + 400, groundY); 
    
    // Floor
    const gradFloor = ctx.createLinearGradient(0, groundY, 0, virtualHeight);
    gradFloor.addColorStop(0, '#334155');
    gradFloor.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradFloor;
    ctx.fillRect(p.cameraX - 100, groundY, virtualWidth + 2000, virtualHeight - groundY);

    // Grid
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.lineWidth = 1;
    const startTick = Math.floor((p.cameraX - 100) / 100) * 100;
    const endTick = startTick + virtualWidth + 400;

    for (let x = startTick; x < endTick; x += 100) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x, groundY + 10); ctx.stroke();
        
        ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x - (x-worldRestX)*0.2, virtualHeight); 
        ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.stroke();
        
        if (x >= worldRestX) {
            const meters = (x - worldRestX) / PIXELS_PER_METER;
            if (meters % 1 === 0) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.fillText(`${meters}m`, x, groundY + 25);
            }
        }
    }

    // Equilibrium Line
    if (worldRestX > p.cameraX - 50 && worldRestX < p.cameraX + virtualWidth + 50) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(worldRestX, groundY - 150); ctx.lineTo(worldRestX, groundY + 20); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#22c55e'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText("REST", worldRestX, groundY - 160);
    }

    // --- 5. Spring ---
    const wallX = 100;
    const springStart = wallX + 20;
    const springEnd = worldRestX + p.springDisp;
    const coils = 12;
    const coilRadius = 25;
    const springLen = springEnd - springStart;
    
    if (springLen > 0) {
        const compressionRatio = Math.max(0, -p.springDisp / MAX_COMPRESSION_PIXELS);
        const r = 148 + (239 - 148) * compressionRatio;
        const g = 163 + (68 - 163) * compressionRatio;
        const b = 184 + (68 - 184) * compressionRatio;
        const mainColor = `rgb(${r},${g},${b})`;

        const step = springLen / (coils * 2); 
        const yBase = groundY - 35;

        // Coil Body
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = mainColor;
        ctx.beginPath();
        ctx.moveTo(springStart, yBase);
        for (let i = 0; i <= coils * 2; i++) {
            const x = springStart + i * step;
            const yOffset = (i % 2 === 0) ? -coilRadius : coilRadius;
            const cpX = x - step/2;
            if (i===0) ctx.lineTo(x,yOffset);
            else ctx.bezierCurveTo(cpX, yOffset + yBase, cpX, yOffset + yBase, x, yOffset + yBase);
        }
        ctx.stroke();
    }

    // --- 6. Ball ---
    const ballRadius = 35;
    const currentBallX = worldRestX + p.ballDisp;
    const currentBallY = groundY - ballRadius;

    ctx.save();
    ctx.translate(currentBallX, currentBallY);
    const rotation = currentBallX / ballRadius;
    ctx.rotate(rotation);
    const gradBall = ctx.createRadialGradient(-10, -10, 5, 0, 0, ballRadius);
    gradBall.addColorStop(0, '#c4b5fd'); gradBall.addColorStop(1, '#4c1d95');
    ctx.fillStyle = gradBall;
    ctx.beginPath(); ctx.arc(0, 0, ballRadius, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -ballRadius); ctx.lineTo(0, ballRadius);
    ctx.moveTo(-ballRadius, 0); ctx.lineTo(ballRadius, 0); ctx.stroke();
    ctx.restore();

    ctx.restore(); // End Camera

    // --- 7. Data Calculation ---
    const jouleScale = 0.005;
    const rawPE = 0.5 * k * Math.pow(p.springDisp, 2);
    const rawKE = 0.5 * p.mass * Math.pow(p.velocity, 2);
    
    // Distance: Current position relative to start position (pixels) -> meters
    const distMeters = Math.abs(p.ballDisp - p.startDisp) / PIXELS_PER_METER;
    
    // Speed: Pixels/frame -> Meters/second (Assuming 60fps)
    const speedMetersPerSec = (Math.abs(p.velocity) * 60) / PIXELS_PER_METER;

    if (epeValueRef.current) epeValueRef.current.innerText = (rawPE * jouleScale).toFixed(1);
    if (keValueRef.current) keValueRef.current.innerText = (rawKE * jouleScale).toFixed(1);
    if (distValueRef.current) distValueRef.current.innerText = distMeters.toFixed(2);
    if (speedValueRef.current) speedValueRef.current.innerText = speedMetersPerSec.toFixed(1);

  }, [compressionInput, isStiff, simulationState]);

  return (
    <>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        <SimulationCanvas draw={draw} isAnimated={true} />
        
        {/* --- HUD Overlay --- */}
        <div className="absolute top-4 left-4 right-4 flex flex-row justify-between items-start pointer-events-none gap-2">
            
            {/* LEFT COLUMN: Energy */}
            <div className="flex flex-col gap-2">
                 {/* Kinetic (Moved to Top) */}
                 <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-start min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Kinetic
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                        <span ref={keValueRef} className="text-blue-400">0.0</span>
                        <span className="text-[10px] text-slate-500">J</span>
                    </div>
                </div>

                 {/* Potential (Moved to Bottom) */}
                 <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-start min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Potential
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                         <span ref={epeValueRef} className="text-red-400">0.0</span>
                         <span className="text-[10px] text-slate-500">J</span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Motion */}
            <div className="flex flex-col gap-2">
                 {/* Distance */}
                 <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        Distance
                        <MoveHorizontal size={10} className="text-slate-500" />
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                         <span ref={distValueRef} className="text-purple-400">0.00</span>
                         <span className="text-[10px] text-slate-500">m</span>
                    </div>
                </div>

                {/* Speed */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        Speed
                        <FastForward size={10} className="text-slate-500" />
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                        <span ref={speedValueRef} className="text-green-400">0.0</span>
                        <span className="text-[10px] text-slate-500">m/s</span>
                    </div>
                </div>
            </div>

        </div>
      </div>

      <ControlPanel 
        title="Elastic Spring" 
        description="Compress the spring to store potential energy. Releasing it converts that potential into kinetic energy (speed)."
      >
        <div className="flex flex-col gap-4">
            <Toggle 
                label={isStiff ? "Spring: STIFF" : "Spring: LOOSE"}
                isOn={isStiff} 
                onToggle={() => {
                    if(simulationState === 'IDLE') setIsStiff(!isStiff);
                }} 
            />
            
            <Slider 
                label="Compression Distance" 
                value={compressionInput} 
                onChange={(v) => {
                    if (simulationState === 'IDLE') setCompressionInput(v);
                }} 
                min={0}
                max={100}
                step={1}
            />
            
            {simulationState === 'IDLE' ? (
                 <ActionButton 
                    label="RELEASE" 
                    onClick={fire} 
                    icon={<Play size={20} fill="currentColor" />}
                    disabled={compressionInput < 5}
                />
            ) : (
                <ActionButton 
                    label="RESET" 
                    variant="secondary"
                    onClick={reset} 
                    icon={<RotateCcw size={20} />}
                />
            )}
        </div>
      </ControlPanel>
    </>
  );
};

export default ElasticSpringSimulation;