import { create } from "zustand";

interface AuthState {
  user: any | null;
  token: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isNewUser: boolean; // 標記是否為新用戶（首次登錄）
  setUser: (user: any, isNew?: boolean) => void;
  setToken: (token: string | null) => void;
  setStatus: (status: 'loading' | 'authenticated' | 'unauthenticated') => void;
  clearNewUserFlag: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  status: 'loading',
  isNewUser: false,
  setUser: (user, isNew = false) => set({ user, isNewUser: isNew }),
  setToken: (token) => set({ token }),
  setStatus: (status) => set({ status }),
  clearNewUserFlag: () => set({ isNewUser: false }),
  logout: () => set({ user: null, token: null, status: 'unauthenticated', isNewUser: false }),
}));






















