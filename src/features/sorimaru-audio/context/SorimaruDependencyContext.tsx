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

/**
 * 🏛️ 오디 오디오 도메인 의존성 주입(Dependency Injection) 컨텍스트 프로바이더
 * 외부에서 커스텀 API 서비스나 핀포인트 Mock 서비스를 자유롭게 주입할 수 있도록 결합도를 낮춥니다.
 */
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

/**
 * 외부에서 주입된 API 서비스(또는 기본 sorimaruApiAdapter)를 해결하는 커스텀 훅
 */
export function useSorimaruApiService(overrideService?: ISorimaruApiService): ISorimaruApiService {
  const context = useContext(SorimaruDependencyContext);
  return overrideService || context.apiService || sorimaruApiAdapter;
}
