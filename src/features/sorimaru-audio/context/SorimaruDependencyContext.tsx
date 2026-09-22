'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { sorimaruApiAdapter } from '@/features/sorimaru-audio/api/sorimaruApi';
import { ISorimaruApiService } from '@/features/sorimaru-audio/types/sorimaru.types';

interface SorimaruDependencyContextValue {
  apiService: ISorimaruApiService;
}

const SorimaruDependencyContext = createContext<SorimaruDependencyContextValue>({
  apiService: sorimaruApiAdapter,
});

export interface SorimaruDependencyProviderProps {
  apiService?: ISorimaruApiService;
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




export function useSorimaruApiService(overrideService?: ISorimaruApiService): ISorimaruApiService {
  const context = useContext(SorimaruDependencyContext);
  return overrideService || context.apiService || sorimaruApiAdapter;
}
