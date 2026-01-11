import React, { useState, useCallback, useRef, useEffect } from 'react';
import SimulationCanvas from '../components/SimulationCanvas';
import ControlPanel from '../components/ControlPanel';
import { Slider, ActionButton, Toggle } from '../components/ui/Controls';
import { RotateCcw, ArrowDown, FastForward } from 'lucide-react';

// --- Physics Definitions ---
type ObjectType = 'HEAVY' | 'MEDIUM' | 'LIGHT';

const OBJECT_DEFS = {
  HEAVY: { 
    id: 'HEAVY', 
    label: 'Iron Ball', 
    colorMain: '#94a3b8', 
    colorHighlight: '#e2e8f0', 
    radius: 35, 
    drag: 0.002, 
    bounciness: 0.3,
    mass: 5.0 // kg
  },
  MEDIUM: { 
    id: 'MEDIUM', 
    label: 'Tennis Ball', 
    colorMain: '#65a30d', 
    colorHighlight: '#bef264', 
    radius: 30, 
    drag: 0.02, 
    bounciness: 0.7,
    mass: 0.5 // kg
  },
  LIGHT: { 
    id: 'LIGHT', 
    label: 'Beach Ball', 
    colorMain: '#db2777', 
    colorHighlight: '#fbcfe8', 
    radius: 50, 
    drag: 0.12, 
    bounciness: 0.85,
    mass: 0.1 // kg
  }
};

const FallingObjectSimulation: React.FC = () => {
  // --- State ---
  const [heightPercent, setHeightPercent] = useState<number>(80);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationFinished, setSimulationFinished] = useState<boolean>(false);
  const [isSlowMo, setIsSlowMo] = useState<boolean>(false);
  
  // New Physics State
  const [objectType, setObjectType] = useState<ObjectType>('MEDIUM');

  // DOM Refs for HUD
  const peValRef = useRef<HTMLSpanElement>(null);
  const keValRef = useRef<HTMLSpanElement>(null);
  const velValRef = useRef<HTMLSpanElement>(null);
  
  // Environment Constant (Vacuum Default)
  const hasAtmosphere = false; 
  
  // Physics Constants
  const GRAVITY = 1.2;
  
  // Physics State Ref
  const physicsState = useRef({
    y: 200,
    velocity: 0,
    groundY: 900, // Fixed in virtual space
    topY: 100,    // Fixed in virtual space
    impactPulse: 0,
    trail: [] as {x: number, y: number, alpha: number, r: number}[]
  });

  // --- Logic Hooks ---

  // Sync Slider to Physics Position (when not falling)
  useEffect(() => {
    if (!isSimulating) {
      const { groundY, topY } = physicsState.current;
      const currentObj = OBJECT_DEFS[objectType];
      const range = groundY - topY - currentObj.radius;
      
      // Map 0-100 input to pixel height
      const targetY = groundY - currentObj.radius - ((heightPercent / 100) * range);
      physicsState.current.y = targetY;
      physicsState.current.velocity = 0;
      physicsState.current.impactPulse = 0;
      physicsState.current.trail = [];
    }
  }, [heightPercent, isSimulating, objectType]);

  const startDrop = () => {
    if (heightPercent < 5) return;
    setIsSimulating(true);
    setSimulationFinished(false);
  };

  const reset = () => {
    setIsSimulating(false);
    setSimulationFinished(false);
  };

  // --- Drawing Logic ---
  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, frame: number) => {
    // 1. Responsive Scaling Strategy:
    // We want to fit the vertical drop (1000 units) into the screen height.
    const V_HEIGHT = 1000;
    const scale = height / V_HEIGHT;
    const V_WIDTH = width / scale;

    ctx.scale(scale, scale);

    // Layout Anchors
    const cx = V_WIDTH / 2; // Center X
    const groundY = 900;
    const topY = 100;
    
    // Update ref groundY for physics consistency
    physicsState.current.groundY = groundY;
    physicsState.current.topY = topY;

    // --- Background ---
    // Deep Lab / Space Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(1, '#1e293b'); // slate-800
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Grid Wall (Back)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 2;
    // Vertical lines starting from center
    for (let i = 0; i <= V_WIDTH/2; i += 100) {
        ctx.beginPath(); ctx.moveTo(cx + i, 0); ctx.lineTo(cx + i, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - i, 0); ctx.lineTo(cx - i, groundY); ctx.stroke();
    }
    // Horizontal lines
    for (let i = topY; i <= groundY; i += 100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(V_WIDTH, i); ctx.stroke();
    }

    const state = physicsState.current;
    const currentObj = OBJECT_DEFS[objectType];
    
    // --- 1. Ground (Perspective Floor) ---
    const drawFloor = () => {
        const floorH = V_HEIGHT - groundY;
        const floorGrad = ctx.createLinearGradient(0, groundY, 0, V_HEIGHT);
        floorGrad.addColorStop(0, '#334155'); // slate-700
        floorGrad.addColorStop(1, '#020617'); // slate-950
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, groundY, V_WIDTH, floorH);

        // Perspective Grid on Floor
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)'; // Sky-400
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Horizon line
        ctx.moveTo(0, groundY);
        ctx.lineTo(V_WIDTH, groundY);
        ctx.stroke();

        // Radiating lines
        for (let i = -500; i <= V_WIDTH + 500; i += 150) {
            ctx.beginPath();
            ctx.moveTo(i, V_HEIGHT);
            ctx.lineTo(cx + (i - cx) * 0.3, groundY); 
            ctx.stroke();
        }
    };
    drawFloor();


    // --- Physics Calculation ---
    const timeScale = isSlowMo ? 0.2 : 1.0;

    if (isSimulating && !simulationFinished) {
        // Drag Calculation
        let dragAccel = 0;
        if (hasAtmosphere) {
            const vSq = state.velocity * state.velocity;
            const dir = state.velocity > 0 ? 1 : -1;
            dragAccel = currentObj.drag * vSq * dir;
        }

        const netAccel = GRAVITY - dragAccel;
        state.velocity += netAccel * timeScale;
        state.y += state.velocity * timeScale;

        // Trail Logic
        if (frame % (isSlowMo ? 5 : 2) === 0) {
            state.trail.push({ x: cx, y: state.y, alpha: 0.5, r: currentObj.radius });
        }

        // Collision
        if (state.y >= groundY - currentObj.radius) {
            state.y = groundY - currentObj.radius;
            if (Math.abs(state.velocity) > 2) {
                // Bounce
                state.impactPulse = Math.abs(state.velocity) * 3; 
                state.velocity *= -currentObj.bounciness; 
            } else {
                state.velocity = 0;
                setSimulationFinished(true);
            }
        }
    } else if (state.impactPulse > 0) {
        state.impactPulse *= 0.9; 
    }

    // Decay trail
    state.trail.forEach(t => t.alpha -= 0.015);
    state.trail = state.trail.filter(t => t.alpha > 0);


    // --- 2. Ruler / Height Indicators ---
    const maxH = groundY - topY - currentObj.radius;
    const drawRuler = () => {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'right';
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        
        const rulerX = cx - 150; // Offset to left of ball
        
        // Draw main vertical line
        ctx.beginPath();
        ctx.moveTo(rulerX, topY);
        ctx.lineTo(rulerX, groundY);
        ctx.stroke();

        // Ticks
        for (let i = 0; i <= 100; i+=25) {
            const y = groundY - (i/100) * maxH - currentObj.radius;
            
            ctx.beginPath();
            ctx.moveTo(rulerX - 10, y);
            ctx.lineTo(rulerX, y);
            ctx.stroke();

            ctx.fillText(`${i}%`, rulerX - 15, y + 4);
        }
    };
    // Only draw ruler if screen is wide enough
    if (V_WIDTH > 350) drawRuler();


    // --- 3. Shadow (Depth Cue) ---
    const heightFromGround = (groundY - currentObj.radius) - state.y;
    const shadowScale = Math.max(0.2, 1 - (heightFromGround / 800));
    const shadowAlpha = Math.max(0.1, 0.6 - (heightFromGround / 600));
    
    ctx.save();
    ctx.translate(cx, groundY);
    ctx.scale(1, 0.3); // Flatten circle to oval
    ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, 0, currentObj.radius * shadowScale * 1.5, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();


    // --- 4. Trail & Object ---
    
    // Trail
    state.trail.forEach(t => {
        ctx.beginPath();
        ctx.arc(cx, t.y, t.r * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `${currentObj.colorHighlight}${Math.floor(t.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
    });

    // Impact Ripple
    if (state.impactPulse > 0.5) {
        ctx.save();
        ctx.translate(cx, groundY);
        ctx.scale(1, 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, state.impactPulse * 3, 0, Math.PI*2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = `rgba(255, 255, 255, ${state.impactPulse / 40})`;
        ctx.stroke();
        ctx.restore();
    }

    // Ball
    const ballGrad = ctx.createRadialGradient(cx - currentObj.radius/3, state.y - currentObj.radius/3, currentObj.radius/10, cx, state.y, currentObj.radius);
    ballGrad.addColorStop(0, currentObj.colorHighlight); 
    ballGrad.addColorStop(1, currentObj.colorMain); 
    
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, state.y, currentObj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pattern for visibility (Beach Ball Stripes)
    if (objectType === 'LIGHT') {
         ctx.save();
         ctx.translate(cx, state.y);
         ctx.clip(new Path2D(`M ${-currentObj.radius} 0 A ${currentObj.radius} ${currentObj.radius} 0 1 1 ${currentObj.radius} 0 A ${currentObj.radius} ${currentObj.radius} 0 1 1 ${-currentObj.radius} 0`));
         
         ctx.strokeStyle = 'rgba(255,255,255,0.4)';
         ctx.lineWidth = 6;
         ctx.beginPath();
         // Vertical-ish stripes
         ctx.moveTo(0, -currentObj.radius); ctx.quadraticCurveTo(20, 0, 0, currentObj.radius);
         ctx.moveTo(0, -currentObj.radius); ctx.quadraticCurveTo(-20, 0, 0, currentObj.radius);
         ctx.stroke();
         
         ctx.restore();
    }
    
    // Rim Light
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, state.y, currentObj.radius - 1, 0, Math.PI*2);
    ctx.stroke();


    // --- 5. Velocity Vector ---
    if (Math.abs(state.velocity) > 0.5) {
        const arrowLen = state.velocity * 5; 
        ctx.save();
        ctx.translate(cx + currentObj.radius + 30, state.y);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, arrowLen);
        
        // Arrow head
        const headSize = 12;
        ctx.lineTo(-headSize/2, arrowLen - (state.velocity > 0 ? headSize : -headSize));
        ctx.moveTo(0, arrowLen);
        ctx.lineTo(headSize/2, arrowLen - (state.velocity > 0 ? headSize : -headSize));
        
        ctx.strokeStyle = '#22c55e'; // Green
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        ctx.restore();
    }

    // --- 6. Physics Data Calc (For HUD) ---
    // Scale: 1 pixel = 1 cm? Let's say max height (800px) is 10 meters.
    const METERS_PER_PIXEL = 10 / 800;
    
    const heightM = heightFromGround * METERS_PER_PIXEL;
    const velocityM = Math.abs(state.velocity) * 10 * METERS_PER_PIXEL; // velocity is px/frame
    
    // PE = mgh (g ~ 9.8)
    const pe = currentObj.mass * 9.8 * heightM;
    // KE = 0.5 * m * v^2
    const ke = 0.5 * currentObj.mass * (velocityM * velocityM);
    
    // Direct DOM Update
    if (peValRef.current) peValRef.current.innerText = pe.toFixed(1);
    if (keValRef.current) keValRef.current.innerText = ke.toFixed(1);
    if (velValRef.current) velValRef.current.innerText = velocityM.toFixed(1);

  }, [isSimulating, simulationFinished, heightPercent, isSlowMo, objectType]);

  return (
    <>
      <div className="flex-1 bg-slate-900 overflow-hidden relative">
        <SimulationCanvas draw={draw} isAnimated={true} />
        
        {/* --- HTML HUD Overlay (Pill Style) --- */}
         <div className="absolute top-4 left-4 right-4 flex flex-row justify-between items-start pointer-events-none gap-2 z-20">
            
            {/* LEFT COLUMN: Speed */}
            <div className="flex flex-col gap-2">
                 <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-start min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        <FastForward size={10} className="text-slate-500" />
                        Speed
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                        <span ref={velValRef} className="text-green-400">0.0</span>
                        <span className="text-[10px] text-slate-500">m/s</span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Energy */}
            <div className="flex flex-col gap-2">
                 {/* Potential */}
                 <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        Potential
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                         <span ref={peValRef} className="text-blue-400">0.0</span>
                         <span className="text-[10px] text-slate-500">J</span>
                    </div>
                </div>

                {/* Kinetic */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-2 rounded-2xl shadow-xl flex flex-col items-end min-w-[90px]">
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                        Kinetic
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    </div>
                    <div className="text-lg font-mono font-bold text-white flex items-baseline gap-1">
                        <span ref={keValRef} className="text-orange-400">0.0</span>
                        <span className="text-[10px] text-slate-500">J</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Drag Helper */}
        {!isSimulating && (
            <div className="absolute top-1/2 left-4 -translate-y-1/2 pointer-events-none opacity-50 hidden md:block">
                <div className="h-64 border-l-2 border-dashed border-white/30 flex flex-col justify-between pl-2">
                    <span className="text-[10px] text-white">100%</span>
                    <span className="text-[10px] text-white">0%</span>
                </div>
            </div>
        )}
      </div>

      <ControlPanel 
        title="Gravitational Energy" 
        description="Explore how Mass and Height affect falling objects. Observe how Potential Energy transforms into Kinetic Energy."
      >
        <div className="flex flex-col gap-5">
            
            {/* Object Selection */}
            <div className="flex gap-2 p-1 bg-slate-800 rounded-xl border border-white/5">
                {(Object.keys(OBJECT_DEFS) as ObjectType[]).map((key) => {
                    const def = OBJECT_DEFS[key];
                    const isActive = objectType === key;
                    return (
                        <button
                            key={key}
                            onClick={() => {
                                setObjectType(key);
                                reset(); 
                            }}
                            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                                isActive 
                                ? 'bg-slate-600 text-white shadow-md' 
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                            }`}
                        >
                            {def.label}
                        </button>
                    );
                })}
            </div>

            <div className="w-full">
                <Slider 
                    label="Drop Height"
                    value={heightPercent}
                    onChange={(val) => {
                        setHeightPercent(val);
                        if (isSimulating) {
                            reset();
                        }
                    }}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4 items-end">
                 <Toggle 
                    label="Slow Motion"
                    isOn={isSlowMo}
                    onToggle={() => setIsSlowMo(!isSlowMo)}
                 />
                 
                 {!isSimulating || simulationFinished ? (
                    simulationFinished ? (
                        <ActionButton 
                            label="Reset" 
                            onClick={reset} 
                            variant="secondary" 
                            icon={<RotateCcw size={20}/>}
                        />
                    ) : (
                        <ActionButton 
                            label="DROP" 
                            onClick={startDrop} 
                            icon={<ArrowDown size={20} />}
                            disabled={heightPercent < 5}
                        />
                    )
                ) : (
                    <ActionButton 
                        label="Dropping..."
                        onClick={() => {}} 
                        disabled={true}
                        variant="ghost"
                    />
                )}
            </div>
        </div>
      </ControlPanel>
    </>
  );
};

export default FallingObjectSimulation;