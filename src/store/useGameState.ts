import { create } from 'zustand'

interface GameState {
  // Global game state properties
  isPaused: boolean
  // Actions
  togglePause: () => void
}

export const useGameState = create<GameState>((set) => ({
  // Initial state
  isPaused: false,
  
  // Actions
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
})) 