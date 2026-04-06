"use client";

import React from 'react';
import { SimulationProvider } from '../application/SimulationProvider';
import { Canvas3D } from './components/Canvas3D';
import { SidebarPanel } from './components/SidebarPanel';
import { CriticalControlsCard } from './components/CriticalControlsCard';
import styles from './SimulationSystem.module.css';

export const SimulationView: React.FC = () => {
  return (
    <div className={styles.simulationView}>
      <SimulationProvider>
        {/* Full-screen Canvas background */}
        <div className={styles.centerCanvas}>
          <Canvas3D />
        </div>

        {/* Floating Critical Controls Alert (top-right) */}
        <CriticalControlsCard />

        {/* Floating Glass Sidebar (Transparent) */}
        <div className={styles.sidebarContainer}>
          <SidebarPanel />
        </div>
      </SimulationProvider>
    </div>
  );
};
