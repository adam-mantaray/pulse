import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const USER_ID_KEY = 'pulse_user_id';
const USER_NAME_KEY = 'pulse_user_name';

const Storage =
  Platform.OS === 'web'
    ? {
        getItemAsync: async (key: string) => localStorage.getItem(key),
        setItemAsync: async (key: string, value: string) => localStorage.setItem(key, value),
        deleteItemAsync: async (key: string) => localStorage.removeItem(key),
      }
    : SecureStore;

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedId = await Storage.getItemAsync(USER_ID_KEY);
        const storedName = await Storage.getItemAsync(USER_NAME_KEY);
        if (storedId) {
          setUserId(storedId);
          setUserName(storedName);
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (id: string, name: string) => {
    await Storage.setItemAsync(USER_ID_KEY, id);
    await Storage.setItemAsync(USER_NAME_KEY, name);
    setUserId(id);
    setUserName(name);
  }, []);

  const logout = useCallback(async () => {
    await Storage.deleteItemAsync(USER_ID_KEY);
    await Storage.deleteItemAsync(USER_NAME_KEY);
    setUserId(null);
    setUserName(null);
  }, []);

  return { userId, userName, isLoading, login, logout };
}
