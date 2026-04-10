"use client";

import { useEffect } from 'react';
import { useCommandSearch, type CommandSearchResult } from './CommandSearchProvider';

type RegisterParams = {
  id: string;
  priority?: number;
  isActive: () => boolean;
  search: (query: string) => Promise<CommandSearchResult> | CommandSearchResult;
};

export function useRegisterCommandSearch(params: RegisterParams) {
  const { registerHandler } = useCommandSearch();

  useEffect(() => {
    return registerHandler({
      id: params.id,
      priority: params.priority,
      isActive: params.isActive,
      search: params.search,
    });
  }, [params.id, params.priority, params.isActive, params.search, registerHandler]);
}

