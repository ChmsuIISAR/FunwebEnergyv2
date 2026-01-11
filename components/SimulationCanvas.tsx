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
        const rect = containerRef.current.getBoundingClientRect();
        const clientWidth = rect.width;
        const clientHeight = rect.height;
        // Handle high DPI displays
        const dpr = window.devicePixelRatio || 1;
        setSize({
          width: Math.max(0, Math.floor(clientWidth * dpr)),
          height: Math.max(0, Math.floor(clientHeight * dpr))
        });
      }
    };

    // Use ResizeObserver so the canvas reacts to parent size changes (mobile UI bars, layout shifts)
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateSize();
      });
      if (containerRef.current) ro.observe(containerRef.current);
    }

    // Fallback for browsers without ResizeObserver and to handle viewport resizes
    window.addEventListener('resize', updateSize);
    updateSize(); // Initial size

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Drawing Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      if (size.width === 0 || size.height === 0) return;

      // Reset any transforms to ensure clearRect covers the full canvas (prevents cumulative transforms on some browsers)
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } catch (e) {
        // setTransform may not be supported in very old contexts; ignore
      }

      // Clear canvas
      ctx.clearRect(0, 0, size.width, size.height);

      // Save context state before drawing
      ctx.save();

      // Pass control to the specific simulation drawer (guard with try/catch to avoid stopping the render loop on runtime errors)
      try {
        draw(ctx, size.width, size.height, frameCountRef.current);
      } catch (err) {
        // Log error but continue; prevents a single draw error from halting animation in some browsers
        // eslint-disable-next-line no-console
        console.error('Simulation draw error:', err);
      }

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