'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { odiiApiAdapter } from '../api/odiiApi';
import { IOdiiApiService } from '../types/odii.types';

interface OdiiDependencyContextValue {
  apiService: IOdiiApiService;
}

const OdiiDependencyContext = createContext<OdiiDependencyContextValue>({
  apiService: odiiApiAdapter,
});

export interface OdiiDependencyProviderProps {
  apiService?: IOdiiApiService;
  children: React.ReactNode;
}

/**
 * 🏛️ 오디 오디오 도메인 의존성 주입(Dependency Injection) 컨텍스트 프로바이더
 * 외부에서 커스텀 API 서비스나 핀포인트 Mock 서비스를 자유롭게 주입할 수 있도록 결합도를 낮춥니다.
 */
export const OdiiDependencyProvider: React.FC<OdiiDependencyProviderProps> = ({
  apiService = odiiApiAdapter,
  children,
}) => {
  const contextValue = useMemo(() => ({ apiService }), [apiService]);

  return (
    <OdiiDependencyContext.Provider value={contextValue}>
      {children}
    </OdiiDependencyContext.Provider>
  );
};

/**
 * 외부에서 주입된 API 서비스(또는 기본 odiiApiAdapter)를 해결하는 커스텀 훅
 */
export function useOdiiApiService(overrideService?: IOdiiApiService): IOdiiApiService {
  const context = useContext(OdiiDependencyContext);
  return overrideService || context.apiService || odiiApiAdapter;
}
