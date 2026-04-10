"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

export type CommandSearchResult = {
  ok: boolean;
  message?: string;
};

type CommandSearchHandler = {
  id: string;
  priority?: number;
  isActive: () => boolean;
  search: (query: string) => Promise<CommandSearchResult> | CommandSearchResult;
};

type CommandSearchContextValue = {
  runSearch: (query: string) => Promise<CommandSearchResult>;
  registerHandler: (handler: CommandSearchHandler) => () => void;
  feedback: string;
  setFeedback: (message: string) => void;
};

const CommandSearchContext = createContext<CommandSearchContextValue | null>(null);

export function CommandSearchProvider({ children }: { children: React.ReactNode }) {
  const handlersRef = useRef<Map<string, CommandSearchHandler>>(new Map());
  const [feedback, setFeedback] = useState('');

  const registerHandler = useCallback((handler: CommandSearchHandler) => {
    handlersRef.current.set(handler.id, handler);
    return () => {
      handlersRef.current.delete(handler.id);
    };
  }, []);

  const runSearch = useCallback(async (query: string): Promise<CommandSearchResult> => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { ok: false, message: 'Ingresa un término para buscar.' };
    }

    const handlers = Array.from(handlersRef.current.values())
      .filter((handler) => handler.isActive())
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

    if (handlers.length === 0) {
      return { ok: false, message: 'No hay búsqueda contextual configurada para esta pantalla.' };
    }

    for (const handler of handlers) {
      const result = await handler.search(cleanQuery);
      if (result.ok) return result;
    }

    return { ok: false, message: 'Sin resultados en el contexto actual.' };
  }, []);

  const value = useMemo(
    () => ({
      runSearch,
      registerHandler,
      feedback,
      setFeedback,
    }),
    [feedback, registerHandler, runSearch]
  );

  return <CommandSearchContext.Provider value={value}>{children}</CommandSearchContext.Provider>;
}

export function useCommandSearch() {
  const context = useContext(CommandSearchContext);
  if (!context) {
    throw new Error('useCommandSearch must be used within CommandSearchProvider');
  }
  return context;
}

