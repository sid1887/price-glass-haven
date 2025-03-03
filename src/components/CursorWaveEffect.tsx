import React, { useEffect, useRef } from 'react';

interface Wave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
}

export const CursorWaveEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waves = useRef<Wave[]>([]);
  const animationRef = useRef<number>();
  
  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    const handleMouseMove = (e: MouseEvent) => {
      // Create a new wave at cursor position
      const colors = [
        'rgba(209, 102, 255, 0.5)', // primary (purple)
        'rgba(255, 94, 177, 0.5)',  // pink
        'rgba(0, 255, 255, 0.5)',   // accent (cyan)
      ];
      
      // Randomly select a color from the theme
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      waves.current.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: 80 + Math.random() * 20,
        opacity: 0.7,
        color: randomColor
      });
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    
    // Animation loop
    const animate = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw waves
      waves.current = waves.current.filter(wave => {
        // Update wave properties
        wave.radius += 2;
        wave.opacity -= 0.018;
        
        // Only keep waves that are still visible
        if (wave.opacity <= 0 || wave.radius >= wave.maxRadius) {
          return false;
        }
        
        // Draw wave
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.strokeStyle = wave.color.replace(/[^,]+(?=\))/, wave.opacity.toString());
        ctx.lineWidth = 2;
        ctx.stroke();
        
        return true;
      });
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ opacity: 0.8 }}
    />
  );
};

export default CursorWaveEffect;
