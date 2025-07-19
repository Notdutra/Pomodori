import { useState, useEffect } from 'react';

export function useSafeLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
      // Whether we found saved data or not, we're done loading
    } catch (error) {
      setError(` ${error} - Failed to load ${key}`);
      localStorage.removeItem(key);
    } finally {
      setIsLoaded(true); // Always mark as loaded
    }
  }, [key]);

  const setSafeValue = (newValue: T) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
      setError(null);
    } catch (error) {
      setError(` ${error} - Failed to save ${key}`);
    }
  };

  return [value, setSafeValue, error, isLoaded] as const;
}
