'use client'

import React, { useState } from 'react'
import { useServerInsertedHTML } from 'next/navigation'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { createEmotionInsertionTracker } from './emotionInsertion'

export function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [registry] = useState(() => {
    const cache = createCache({ key: 'css' })
    cache.compat = true
    const tracker = createEmotionInsertionTracker(cache)
    return { cache, tracker }
  })

  useServerInsertedHTML(() => {
    const insertion = registry.tracker.flush()
    if (!insertion) return null

    return (
      <style
        data-emotion={`${registry.cache.key} ${insertion.names.join(' ')}`}
        dangerouslySetInnerHTML={{
          __html: insertion.css,
        }}
      />
    )
  })

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>
}
