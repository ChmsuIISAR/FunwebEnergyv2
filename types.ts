// Simulation Identifiers
export enum SimulationType {
  BATTERY_BULB = 'BATTERY_BULB',
  WINDMILL = 'WINDMILL',
  FALLING_OBJECT = 'FALLING_OBJECT',
  SOLAR_PANEL = 'SOLAR_PANEL',
  ELASTIC_SPRING = 'ELASTIC_SPRING',
}

// Shared Energy Abstraction
export interface EnergyState {
  energyInputLevel: number; // 0-1 or 0-100 normalized
  transferEnabled: boolean;
  effectIntensity: number; // derived observable effect
}

// Visual Theme Constants
export const COLORS = {
  background: '#1e293b', // slate-800
  wire: '#94a3b8', // slate-400
  wireActive: '#fbbf24', // amber-400
  batteryBody: '#334155', // slate-700
  batteryPos: '#ef4444', // red-500
  batteryNeg: '#0f172a', // slate-900
  bulbOff: '#475569', // slate-600
  bulbOn: '#fef08a', // yellow-200
  switchOpen: '#ef4444', // red-500
  switchClosed: '#22c55e', // green-500
  windBlade: '#e0f2fe', // sky-100
  ground: '#15803d', // green-700
  object: '#a855f7', // purple-500
};

export interface CanvasSize {
  width: number;
  height: number;
}