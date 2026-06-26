import React, { useEffect, useRef, useState } from 'react';

interface VictoryParticlesProps {
  active: boolean;
  boardRef: React.RefObject<HTMLDivElement | null>;
  gridWidth: number;
  gridHeight: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  rotation: number;
  rotationSpeed: number;
  type: 'star' | 'circle' | 'rect';
  shapeWidth: number;
  shapeHeight: number;
  sparkleSpeed: number;
  sparklePhase: number;
}

// Function to map block color classes/names to hexadecimal color codes for the canvas
const mapColorToHex = (colorClass?: string): string => {
  if (!colorClass) return '#f59e0b'; // Default to warm Amber
  const lower = colorClass.toLowerCase();
  
  if (lower.includes('sage') || lower.includes('#8ba89a')) return '#a8cfbd';
  if (lower.includes('coral') || lower.includes('#c07d72')) return '#f29886';
  if (lower.includes('mustard') || lower.includes('#c8a86e')) return '#f2ca86';
  if (lower.includes('blue') || lower.includes('cobalt') || lower.includes('#4a7ba8')) return '#6ea1d4';
  if (lower.includes('lavender') || lower.includes('purple') || lower.includes('#9f8cb6')) return '#bfaad4';
  if (lower.includes('rose') || lower.includes('pink') || lower.includes('#b57c8d')) return '#dca6b4';
  if (lower.includes('emerald') || lower.includes('green') || lower.includes('#426657')) return '#54c090';
  if (lower.includes('amber') || lower.includes('yellow') || lower.includes('#f59e0b')) return '#fbbf24';
  
  // Custom fallback palette colors
  const palette = ['#38bdf8', '#34d399', '#f472b6', '#fb7185', '#a78bfa', '#fbbf24'];
  const hash = lower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
};

export const VictoryParticles: React.FC<VictoryParticlesProps> = ({
  active,
  boardRef,
  gridWidth,
  gridHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const particleIdCounterRef = useRef(0);
  const hasTriggeredRef = useRef(false);

  // ResizeObserver setup to dynamically adjust canvas bounds to its parent container cleanly
  useEffect(() => {
    const parent = containerRef.current;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(parent);
    
    // Set initial size
    const rect = parent.getBoundingClientRect();
    setDimensions({ width: rect.width, height: rect.height });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update canvas internal resolutions when state dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
    }
  }, [dimensions]);

  // Create individual particles
  const createParticle = (
    x: number,
    y: number,
    colorHex: string,
    isCornerFountain = false
  ): Particle => {
    const id = particleIdCounterRef.current++;
    
    // Random angle and speed
    const angle = isCornerFountain 
      ? (x < dimensions.width / 2 ? -Math.PI / 6 - Math.random() * Math.PI / 3 : -Math.PI * 5/6 + Math.random() * Math.PI / 3) 
      : Math.random() * Math.PI * 2;
      
    const speed = isCornerFountain
      ? 6 + Math.random() * 10
      : 1.5 + Math.random() * 5.5;

    const types: Particle['type'][] = ['circle', 'rect', 'star'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
      id,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isCornerFountain ? 2 : 0.5), // upwards bias for corner fountains
      radius: 3 + Math.random() * 5,
      color: colorHex,
      alpha: 1,
      decay: 0.008 + Math.random() * 0.012,
      gravity: 0.12 + Math.random() * 0.1,
      drag: 0.97 + Math.random() * 0.02,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      type,
      shapeWidth: 6 + Math.random() * 8,
      shapeHeight: 3 + Math.random() * 5,
      sparkleSpeed: 0.05 + Math.random() * 0.1,
      sparklePhase: Math.random() * Math.PI * 2,
    };
  };

  // Trigger burst explosions from cells and four corner points
  const triggerVictoryExplosions = () => {
    const board = boardRef.current;
    const canvas = canvasRef.current;
    if (!board || !canvas) return;

    const mainElement = canvas.parentElement;
    if (!mainElement) return;

    const mainRect = mainElement.getBoundingClientRect();
    const boardRect = board.getBoundingClientRect();

    const particles: Particle[] = [];

    // 1. Burst from all board grid cell locations
    const cells = board.children;
    const count = Math.min(cells.length, gridWidth * gridHeight);

    for (let index = 0; index < count; index++) {
      const cellElement = cells[index] as HTMLElement;
      if (!cellElement) continue;

      // Check if it is a filled grid cell (has placed block bg color class)
      const className = cellElement.className || '';
      const isFilled = className.includes('bg-') && !className.includes('bg-[#F5F2EF]') && !className.includes('bg-[#1e1e1e]') && !className.includes('bg-[#150f38]') && !className.includes('bg-[#3a1d21]') && !className.includes('bg-[#14200c]');
      
      if (isFilled) {
        const cellRect = cellElement.getBoundingClientRect();
        const x = cellRect.left - mainRect.left + cellRect.width / 2;
        const y = cellRect.top - mainRect.top + cellRect.height / 2;

        // Try to identify colors from the element's class list
        let matchingColor = '#fbbf24'; // fallback amber
        const classes = className.split(' ');
        const bgClass = classes.find(c => c.startsWith('bg-'));
        if (bgClass) {
          matchingColor = mapColorToHex(bgClass);
        }

        // Spawn 12-16 particles from the center of this solved grid cell
        const spawnCount = 14 + Math.floor(Math.random() * 5);
        for (let s = 0; s < spawnCount; s++) {
          particles.push(createParticle(x, y, matchingColor, false));
        }
      }
    }

    // 2. Corner congratulatory giant fountains
    const cornerOffsets = [
      { x: boardRect.left - mainRect.left, y: boardRect.bottom - mainRect.top }, // Bottom Left
      { x: boardRect.right - mainRect.left, y: boardRect.bottom - mainRect.top }, // Bottom Right
      { x: boardRect.left - mainRect.left, y: boardRect.top - mainRect.top }, // Top Left
      { x: boardRect.right - mainRect.left, y: boardRect.top - mainRect.top }, // Top Right
    ];

    const festiveColors = ['#fbbf24', '#34d399', '#6ea1d4', '#dca6b4', '#bfaad4'];
    
    cornerOffsets.forEach((pos) => {
      // Spawn 25-35 rich confetti fountain pieces at each corner
      const spawnCount = 28 + Math.floor(Math.random() * 10);
      for (let s = 0; s < spawnCount; s++) {
        const randomColor = festiveColors[Math.floor(Math.random() * festiveColors.length)];
        particles.push(createParticle(pos.x, pos.y, randomColor, true));
      }
    });

    particlesRef.current = particles;
  };

  // Particle updates and rendering animation loop
  useEffect(() => {
    if (active) {
      if (!hasTriggeredRef.current) {
        triggerVictoryExplosions();
        hasTriggeredRef.current = true;
      }
    } else {
      hasTriggeredRef.current = false;
      particlesRef.current = [];
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawStar = (cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
    };

    const loop = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const particles = particlesRef.current;
      if (particles.length === 0 && !active) {
        animationFrameRef.current = null;
        return;
      }

      // Keep particles state
      const aliveParticles: Particle[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        // Physics update
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;
        p.sparklePhase += p.sparkleSpeed;

        if (p.alpha > 0 && p.y < dimensions.height + 50 && p.x > -50 && p.x < dimensions.width + 50) {
          aliveParticles.push(p);

          // Render Particle
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.strokeStyle = p.color;

          // Shimmer/sparkle scaling factor
          const shimmer = 0.7 + 0.3 * Math.sin(p.sparklePhase);

          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          if (p.type === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * shimmer, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.type === 'rect') {
            ctx.fillRect(
              -p.shapeWidth * shimmer / 2,
              -p.shapeHeight * shimmer / 2,
              p.shapeWidth * shimmer,
              p.shapeHeight * shimmer
            );
          } else if (p.type === 'star') {
            drawStar(0, 0, 5, p.radius * 1.3 * shimmer, p.radius * 0.5 * shimmer);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      particlesRef.current = aliveParticles;
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [active, dimensions]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
};
