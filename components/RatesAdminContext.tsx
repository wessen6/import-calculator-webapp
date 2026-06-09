"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type RatesAdminActions = {
  onSave: () => void;
  onReset: () => void;
  onExit: () => void;
};

type RatesAdminContextValue = {
  isAdminMode: boolean;
  setIsAdminMode: (value: boolean) => void;
  actions: RatesAdminActions | null;
  setActions: (actions: RatesAdminActions | null) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
};

const RatesAdminContext = createContext<RatesAdminContextValue | null>(null);

export function RatesAdminProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [actions, setActions] = useState<RatesAdminActions | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const value = useMemo(
    () => ({
      isAdminMode,
      setIsAdminMode,
      actions,
      setActions,
      hasUnsavedChanges,
      setHasUnsavedChanges
    }),
    [isAdminMode, actions, hasUnsavedChanges]
  );

  return <RatesAdminContext.Provider value={value}>{children}</RatesAdminContext.Provider>;
}

export function useRatesAdmin() {
  const context = useContext(RatesAdminContext);

  if (!context) {
    throw new Error("useRatesAdmin must be used within RatesAdminProvider");
  }

  return context;
}

export function useOptionalRatesAdmin() {
  return useContext(RatesAdminContext);
}
