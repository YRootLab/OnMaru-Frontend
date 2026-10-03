import React, { useState } from 'react';
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
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <img
        src={imgSrc}
        alt=""
        aria-hidden="true"
        width={size * 0.78}
        height={size * 0.78}
        style={{ objectFit: 'contain', display: 'block' }}
        onError={() => setImgSrc('/images/character/Oni_hi.png')}
      />
    </div>
  );
}
