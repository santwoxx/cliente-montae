// ============================================================
// MontaÊ - Logo com degradação elegante
// Se o arquivo da marca não carregar, mostra o monograma
// em vez de deixar um quadrado vazio na tela.
// ============================================================

import React, { useState } from 'react';

export default function Logo({ className = 'brand-mark', size = 38, alt = '' }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={className}>
      {failed ? (
        <span aria-hidden="true">MÊ</span>
      ) : (
        <img
          src="/logo.jpeg"
          alt={alt}
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
