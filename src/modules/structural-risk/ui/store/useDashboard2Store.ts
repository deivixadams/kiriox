import { create } from 'zustand';

export type Dashboard2Mode = 'explorer' | 'ranked' | 'cascade' | 'trigger' | 'coverage' | 'ask';
export type Dashboard2Layout = 'fcose' | 'breadthfirst' | 'circle';

type Dashboard2State = {
  // Canvas
  selectedNodeId: string | null;
  layout: Dashboard2Layout;
  mode: Dashboard2Mode;
  // Filters
  nodeFilter: string;
  activeNodeTypes: string[];
  onlyHardGate: boolean;
  criticalityMin: number;
  // UI
  rightPanelOpen: boolean;
  // Actions
  setSelectedNodeId: (id: string | null) => void;
  setLayout: (layout: Dashboard2Layout) => void;
  setMode: (mode: Dashboard2Mode) => void;
  toggleNodeType: (type: string) => void;
  clearNodeTypes: () => void;
  setOnlyHardGate: (val: boolean) => void;
  setCriticalityMin: (val: number) => void;
  setNodeFilter: (filter: string) => void;
  setRightPanelOpen: (open: boolean) => void;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;
};

export const useDashboard2Store = create<Dashboard2State>((set) => ({
  selectedNodeId: null,
  layout: 'fcose',
  mode: 'explorer',
  nodeFilter: 'all',
  activeNodeTypes: ['REINO', 'DOMAIN', 'ELEMENT', 'RISK', 'CONTROL'],
  onlyHardGate: false,
  criticalityMin: 0,
  rightPanelOpen: false,

  setSelectedNodeId: (id) =>
    set({ selectedNodeId: id, rightPanelOpen: id !== null }),

  setLayout: (layout) => set({ layout }),
  setMode: (mode) => set({ mode }),

  toggleNodeType: (type) =>
    set((s) => ({
      activeNodeTypes: s.activeNodeTypes.includes(type)
        ? s.activeNodeTypes.filter((t) => t !== type)
        : [...s.activeNodeTypes, type],
    })),

  clearNodeTypes: () => set({ activeNodeTypes: [] }),
  setOnlyHardGate: (val) => set({ onlyHardGate: val }),
  setCriticalityMin: (val) => set({ criticalityMin: val }),
  setNodeFilter: (filter) => set({ nodeFilter: filter }),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  rotationSpeed: 50,
  setRotationSpeed: (speed) => set({ rotationSpeed: speed }),
}));
