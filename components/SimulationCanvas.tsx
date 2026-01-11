import React, { useRef, useEffect, useState } from 'react';

interface SimulationCanvasProps {
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, frameCount: number) => void;
  className?: string;
  isAnimated?: boolean;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ draw, className, isAnimated = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Resize handler
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        setSize({
          width: clientWidth * dpr,
          height: clientHeight * dpr
        });
      }
    };

    window.addEventListener('resize', updateSize);
    updateSize(); // Initial size

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (size.width === 0 || size.height === 0) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, size.width, size.height);
      
      // Save context state before drawing
      ctx.save();
      
      // Pass control to the specific simulation drawer
      draw(ctx, size.width, size.height, frameCountRef.current);
      
      ctx.restore();

      if (isAnimated) {
        frameCountRef.current++;
        requestRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [draw, size, isAnimated]);

  return (
    <div ref={containerRef} className={`w-full h-full relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        style={{ width: '100%', height: '100%' }}
        className="block touch-none"
      />
    </div>
  );
};

export default SimulationCanvas;