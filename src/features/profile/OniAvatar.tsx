import React, { useEffect, useState } from 'react';
import { resolveCharacterPath, resolveBackground } from './assets';

interface OniAvatarProps {
  characterId?: string;
  backgroundId?: string;
  size?: number;
  className?: string;
}

export function OniAvatar({ characterId, backgroundId, size = 48, className }: OniAvatarProps) {
  const bg = resolveBackground(backgroundId);
  const src = resolveCharacterPath(characterId);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const currentSrc = hasError ? '/images/character/Oni_hi.png' : src;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img
        src={currentSrc}
        alt=""
        aria-hidden="true"
        style={{
          width: '92%',
          height: '92%',
          objectFit: 'contain',
          objectPosition: 'center bottom',
          display: 'block',
        }}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
