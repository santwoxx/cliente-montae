import React, { useState } from 'react';

/**
 * MontaÊ - Logo com degradação elegante.
 * - variant="icon": selo quadrado com o "M" tridimensional dourado (/logo-icon.png)
 * - variant="full": banner completo com o monograma e tipografia (/logo.jpeg)
 */
export default function Logo({
  className = 'brand-mark',
  size = 38,
  alt = 'MontaÊ',
  variant = 'icon',
}) {
  const [failed, setFailed] = useState(false);

  const isFull = variant === 'full';
  const src = isFull ? '/logo.jpeg' : '/logo-icon.png';

  return (
    <span className={className}>
      {failed ? (
        <span aria-hidden="true" className="brand-fallback">
          MÊ
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          width={size}
          height={isFull ? undefined : size}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
