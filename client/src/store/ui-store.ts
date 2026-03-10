import { create } from "zustand";

/**
 * Store de estado de UI global (Zustand).
 * Cumple el requisito de state management del Ej. 3 (Redux/Zustand).
 * Los datos de servidor siguen en TanStack React Query; este store es para estado de cliente.
 */
interface UIState {
  /** Panel de conversaciones en página Agent colapsado (solo ícono) */
  agentConversationsCollapsed: boolean;
  setAgentConversationsCollapsed: (collapsed: boolean) => void;
  toggleAgentConversationsCollapsed: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  agentConversationsCollapsed: false,
  setAgentConversationsCollapsed: (collapsed) => set({ agentConversationsCollapsed: collapsed }),
  toggleAgentConversationsCollapsed: () =>
    set((s) => ({ agentConversationsCollapsed: !s.agentConversationsCollapsed })),
}));
