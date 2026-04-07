import { create } from 'zustand';
import { 
  SimulationSubgraph, 
  MonteCarloSummary, 
  SimulationNode,
  MonteCarloRunMetadata 
} from '../modules/monte-carlo/domain/types';

interface MonteCarloState {
  reino: string;
  iterations: number;
  seedLimit: number;
  subgraph: SimulationSubgraph | null;
  summary: MonteCarloSummary | null;
  runMetadata: MonteCarloRunMetadata | null;
  selectedNode: SimulationNode | null;
  isRunning: boolean;
  isLoadingSubgraph: boolean;
  progressIteration: number;
  progressTotal: number;
  activeControlIds: string[];
  error: string | null;

  setReino: (reino: string) => void;
  setIterations: (iterations: number) => void;
  setSeedLimit: (seedLimit: number) => void;
  fetchSubgraph: () => Promise<void>;
  runSimulation: () => Promise<void>;
  setSelectedNode: (node: SimulationNode | null) => void;
  reset: () => void;
}

export const useMonteCarloStore = create<MonteCarloState>((set, get) => ({
  reino: 'AML',
  iterations: 2000,
  seedLimit: 30,
  subgraph: null,
  summary: null,
  runMetadata: null,
  selectedNode: null,
  isRunning: false,
  isLoadingSubgraph: false,
  progressIteration: 0,
  progressTotal: 0,
  activeControlIds: [],
  error: null,

  setReino: (reino) => set({ reino }),
  setIterations: (iterations) => set({ iterations }),
  setSeedLimit: (seedLimit) => set({ seedLimit, subgraph: null, summary: null }),

  fetchSubgraph: async () => {
    set({ isLoadingSubgraph: true, error: null });
    try {
      const { reino, seedLimit } = get();
      const res = await fetch(`/api/montecarlo/subgraph?reino=${reino}&seedLimit=${seedLimit}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const message = data?.details || data?.error || `Failed to fetch subgraph (HTTP ${res.status})`;
        throw new Error(message);
      }
      set({ subgraph: data, isLoadingSubgraph: false });
    } catch (err: any) {
      set({ error: err.message, isLoadingSubgraph: false });
    }
  },

  runSimulation: async () => {
    const { subgraph, reino, iterations, seedLimit } = get();
    set({ isRunning: true, error: null, progressIteration: 0, progressTotal: iterations, activeControlIds: [] });
    try {
      const res = await fetch('/api/montecarlo/run/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reino, iterations, seedLimit })
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.details || data?.error || 'Simulation run failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith('data:')) continue;
          const payload = line.replace(/^data:\s*/, '');
          if (!payload) continue;

          const msg = JSON.parse(payload);
          if (msg.type === 'progress') {
            set({
              progressIteration: msg.iteration,
              progressTotal: msg.total,
              activeControlIds: msg.active_controls || []
            });
          }
          if (msg.type === 'done') {
            set({
              summary: msg.summary,
              runMetadata: msg.run_metadata ?? null,
              isRunning: false,
              progressIteration: msg.run_metadata?.iterations ?? iterations,
              progressTotal: msg.run_metadata?.iterations ?? iterations,
              activeControlIds: []
            });
          }
        }
      }
    } catch (err: any) {
      console.error("Simulation error:", err);
      set({ error: err.message, isRunning: false, activeControlIds: [] });
    }
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  reset: () => set({
    subgraph: null,
    summary: null,
    runMetadata: null,
    selectedNode: null,
    isRunning: false,
    isLoadingSubgraph: false,
    progressIteration: 0,
    progressTotal: 0,
    activeControlIds: [],
    error: null
  })
}));
