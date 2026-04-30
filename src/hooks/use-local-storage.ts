import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { LEGACY_KEY_MAP } from "@/lib/storage-keys";

export type PersistenceStatus = "idle" | "saving" | "saved" | "error";

export interface PersistenceState {
  status: PersistenceStatus;
  error?: string;
  lastSavedAt?: string;
}

interface UseLocalStorageOptions<T> {
  deserialize?: (value: unknown) => T;
  silent?: boolean;
  externalUpdateMessage?: string;
}

export interface UseLocalStorageResult<T> extends PersistenceState {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  clearError: () => void;
}

function getStorageErrorMessage(error: unknown) {
  if (
    error instanceof DOMException &&
    (error.code === 22 ||
      error.code === 1014 ||
      error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) {
    return "Local storage is full. Export a backup or delete old workspace data.";
  }

  return "Couldn't save locally. Export a backup before refreshing.";
}

function safeSerialize<T>(value: T) {
  try {
    return { ok: true as const, value: JSON.stringify(value) };
  } catch {
    return { ok: false as const, error: "Couldn't serialize local workspace data." };
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: UseLocalStorageOptions<T>,
): UseLocalStorageResult<T> {
  const deserialize = options?.deserialize;
  const silent = options?.silent;
  const externalUpdateMessage = options?.externalUpdateMessage;
  const initialPersistenceRef = useRef<PersistenceState>({ status: "idle" });
  const hasStoredValueRef = useRef(false);
  const initialStoredRawRef = useRef("");

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        hasStoredValueRef.current = true;
        initialStoredRawRef.current = item;
        const parsed = JSON.parse(item) as T;
        return deserialize ? deserialize(parsed) : parsed;
      }

      // No value under the current key - attempt to migrate from legacy keys if available.
      try {
        const legacyKeys = LEGACY_KEY_MAP[key] ?? [];
        for (const legacyKey of legacyKeys) {
          const legacyItem = window.localStorage.getItem(legacyKey);
          if (legacyItem) {
            const parsed = JSON.parse(legacyItem) as T;
            // Return legacy value so the hook will write it under the new key on first save.
            return deserialize ? deserialize(parsed) : parsed;
          }
        }
      } catch {
        // Ignore migration failures and fall back to defaults.
      }

      return initialValue;
    } catch {
      initialPersistenceRef.current = {
        status: "error",
        error: "Saved local data could not be read. A default workspace was loaded instead.",
      };
      return initialValue;
    }
  });

  const [persistence, setPersistence] = useState<PersistenceState>(initialPersistenceRef.current);
  const lastSavedValueRef = useRef(hasStoredValueRef.current ? initialStoredRawRef.current : "");

  const clearError = useCallback(() => {
    setPersistence((current) => ({
      status: current.lastSavedAt ? "saved" : "idle",
      lastSavedAt: current.lastSavedAt,
    }));
  }, []);

  useEffect(() => {
    const serialized = safeSerialize(storedValue);
    if (!serialized.ok) {
      setPersistence({ status: "error", error: serialized.error });
      return;
    }

    if (serialized.value === lastSavedValueRef.current) {
      return;
    }

    setPersistence((current) => ({ ...current, status: "saving", error: undefined }));
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, serialized.value);
        const savedAt = new Date().toISOString();
        lastSavedValueRef.current = serialized.value;
        setPersistence({ status: "saved", lastSavedAt: savedAt });
      } catch (error) {
        const message = getStorageErrorMessage(error);
        setPersistence({ status: "error", error: message });

        if (!silent) {
          toast({
            title: error instanceof DOMException && error.name === "QuotaExceededError" ? "Local storage is full" : "Local save failed",
            description: message,
            variant: "destructive",
          });
        }
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [key, silent, storedValue]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key || event.newValue === lastSavedValueRef.current) return;

      try {
        const nextValue = event.newValue
          ? deserialize
            ? deserialize(JSON.parse(event.newValue))
            : (JSON.parse(event.newValue) as T)
          : initialValue;

        const serialized = safeSerialize(nextValue);
        lastSavedValueRef.current = serialized.ok ? serialized.value : event.newValue ?? "";
        setStoredValue(nextValue);
        setPersistence({ status: "saved", lastSavedAt: new Date().toISOString() });

        if (!silent) {
          toast({
            title: "Workspace updated from another tab",
            description: externalUpdateMessage ?? "Local workspace data was refreshed.",
          });
        }
      } catch {
        const message = "A local update from another tab could not be loaded.";
        setPersistence({ status: "error", error: message });
        if (!silent) {
          toast({ title: "Cross-tab update failed", description: message, variant: "destructive" });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [deserialize, externalUpdateMessage, initialValue, key, silent]);

  return {
    value: storedValue,
    setValue: setStoredValue,
    status: persistence.status,
    error: persistence.error,
    lastSavedAt: persistence.lastSavedAt,
    clearError,
  };
}
