"use client";

import React, { useEffect, useRef } from 'react';
import { useSimulationStore } from '../../application/SimulationProvider';
import { ThreeManager } from '../../infrastructure/ThreeManager';

export const Canvas3D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<ThreeManager | null>(null);
  const { nodes, edges, toggleControl } = useSimulationStore();

  useEffect(() => {
    if (canvasRef.current && !managerRef.current) {
      managerRef.current = new ThreeManager(canvasRef.current, toggleControl);
    }
    
    const handleResize = () => {
      if (managerRef.current && containerRef.current) {
        // Use clientWidth/Height directly for reliability
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        if (width > 0 && height > 0) {
          managerRef.current.camera.aspect = width / height;
          managerRef.current.camera.updateProjectionMatrix();
          managerRef.current.renderer.setSize(width, height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize to fit container after a small delay to ensure DOM is ready
    const timer = setTimeout(handleResize, 50);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
      if (managerRef.current) {
        managerRef.current.cleanup();
        managerRef.current = null;
      }
    };
  }, [toggleControl]);

  useEffect(() => {
    if (managerRef.current && nodes && edges.length > 0) {
      managerRef.current.updateData(nodes, edges);
    }
  }, [nodes, edges]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#020617', overflow: 'hidden' }}
    >
      <canvas 
        ref={canvasRef} 
        style={{ display: 'block', width: '100%', height: '100%', outline: 'none' }}
      />
    </div>
  );
};
