import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use a different storage implementation for web
const storage = Platform.OS === 'web' 
  ? {
      getItem: async (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Ignore write errors
        }
      },
      removeItem: async (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Ignore remove errors
        }
      },
    }
  : AsyncStorage;

export default storage;