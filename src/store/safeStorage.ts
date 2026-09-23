import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

// Se o armazenamento do aparelho/navegador falhar (modo privado, navegador restrito),
// seguimos com uma cópia em memória em vez de travar o carregamento do app.
const memory = new Map<string, string>();

export const safeStorage: StateStorage = {
  getItem: async (key) => {
    try {
      return (await AsyncStorage.getItem(key)) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem: async (key, value) => {
    memory.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // mantém só em memória
    }
  },
  removeItem: async (key) => {
    memory.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // nada a remover
    }
  },
};
