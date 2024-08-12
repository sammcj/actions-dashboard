"use client";

import { log } from "@/lib/log";
import { useEffect, useState } from "react";

export default function useLocalStorage<Type>(
  key: string,
  initialValue: Type,
): [Type, (arg: Type) => void, () => void] {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item =
        typeof window !== "undefined"
          ? window.localStorage.getItem(key)
          : false;
      return item ? (JSON.parse(item) as Type) : initialValue;
    } catch (err) {
      log.error(err);
      return initialValue;
    }
  });

  const setValue = (value: Type) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (err) {
      log.error(err);
    }
  };

  const clearValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (err) {
      log.error(err);
    }
  };

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [storedValue]);

  return [storedValue, setValue, clearValue];
}
