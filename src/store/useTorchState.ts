import { create } from 'zustand'

interface TorchState {
  intensity: number
  flickerIntensity: number
  updateFlicker: () => void
}

export const useTorchState = create<TorchState>((set) => ({
  intensity: 1,
  flickerIntensity: 1,
  updateFlicker: () => {
    // Random flicker between 0.8 and 1.2
    const newFlicker = 0.8 + Math.random() * 0.4
    set({ flickerIntensity: newFlicker })
  },
})) 