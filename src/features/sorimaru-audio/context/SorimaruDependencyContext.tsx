'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import type { SorimaruRepository } from '@/features/sorimaru-audio/application/SorimaruRepository';

interface SorimaruDependencyContextValue {
  apiService: SorimaruRepository;
}

const SorimaruDependencyContext = createContext<SorimaruDependencyContextValue>({
  apiService: sorimaruApiAdapter,
});

export interface SorimaruDependencyProviderProps {
  apiService?: SorimaruRepository;
  children: React.ReactNode;
}





export const SorimaruDependencyProvider: React.FC<SorimaruDependencyProviderProps> = ({
  apiService = sorimaruApiAdapter,
  children,
}) => {
  const contextValue = useMemo(() => ({ apiService }), [apiService]);

  return (
    <SorimaruDependencyContext.Provider value={contextValue}>
      {children}
    </SorimaruDependencyContext.Provider>
  );
};




export function useSorimaruApiService(overrideService?: SorimaruRepository): SorimaruRepository {
  const context = useContext(SorimaruDependencyContext);
  return overrideService || context.apiService || sorimaruApiAdapter;
}
