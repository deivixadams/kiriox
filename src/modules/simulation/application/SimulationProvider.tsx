"use client";

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { NodeData, EdgeData, SystemMetrics, SimulationEvent, AnalyticsEngine } from '../domain/AnalyticsEngine';

interface SimulationState {
  nodes: Record<string, NodeData>;
  edges: EdgeData[];
  metrics: SystemMetrics;
  events: SimulationEvent[];
  toggleControl: (id: string) => void;
  resetSimulation: () => void;
}

const SimulationContext = createContext<SimulationState | null>(null);

export const useSimulationStore = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error("Debe usarse dentro de SimulationProvider");
  return context;
};

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<Record<string, NodeData>>({});
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    linearExposure: 0, structuralFragility: 0, activeRisksCount: 0, failedControlsCount: 0, criticalElementsCount: 0
  });

  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = AnalyticsEngine.generateTopology();
    const { updatedNodes, metrics: initialMetrics } = AnalyticsEngine.recalculateState(initialNodes);
    setNodes(updatedNodes);
    setEdges(initialEdges);
    setMetrics(initialMetrics);
  }, []);

  const toggleControl = useCallback((id: string) => {
    setNodes(prev => {
      const next = { ...prev };
      if (next[id] && next[id].type === 'control') {
        const wasActive = prev[id].active;
        next[id] = { ...next[id], active: !next[id].active };
        const { updatedNodes, metrics: newMetrics } = AnalyticsEngine.recalculateState(next);
        setMetrics(newMetrics);
        
        if (wasActive && !next[id].active) {
          const newlyActiveRisks = Object.values(updatedNodes)
            .filter(n => n.type === 'risk' && n.active && !prev[n.id].active && prev[id].dependencies.includes(n.id))
            .map(n => n.id);
          
          const newlyStressedElements = Object.values(updatedNodes)
            .filter(n => n.type === 'element' && n.stress > prev[n.id].stress && newlyActiveRisks.some(rId => prev[rId].dependencies.includes(n.id)))
            .map(n => n.id);

          const newEvent: SimulationEvent = {
            id: Math.random().toString(36).substr(2, 9),
            time: new Date(),
            controlId: id,
            risksMaterialized: newlyActiveRisks,
            elementsAffected: newlyStressedElements
          };
          setEvents(currentEvents => [newEvent, ...currentEvents].slice(0, 50));
        }
        
        return updatedNodes;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => {
        const activeControls = Object.values(prev).filter(n => n.type === 'control' && n.active);
        if (activeControls.length > 0) {
          const randomControl = activeControls[Math.floor(Math.random() * activeControls.length)];
          // Llamamos a toggleControl internamente para mantener la lógica de eventos
          toggleControl(randomControl.id);
        }
        return prev; // Not directly used here as toggleControl handles state
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [toggleControl]);

  const resetSimulation = useCallback(() => {
    setNodes(prev => {
      const next = JSON.parse(JSON.stringify(prev)) as Record<string, NodeData>;
      Object.values(next).forEach(node => {
        if (node.type === 'control') {
          node.active = true;
        }
      });
      const { updatedNodes, metrics: newMetrics } = AnalyticsEngine.recalculateState(next);
      setMetrics(newMetrics);
      return updatedNodes;
    });
    setEvents([]);
  }, []);

  if (Object.keys(nodes).length === 0) return null; // Let the UI handle loading

  return (
    <SimulationContext.Provider value={{ nodes, edges, metrics, events, toggleControl, resetSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
};
