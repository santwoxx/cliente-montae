// ============================================================
// MontaÊ - Captura de assinatura digital
//
// Melhorias sobre a versão anterior:
//  - o traço acompanha a rotação da tela (antes a assinatura sumia)
//  - usa Pointer Events, cobrindo dedo, caneta e mouse com um só código
//  - captura o ponteiro, então o traço não corta ao sair da área
//  - ignora toques múltiplos, evitando riscos ao apoiar a mão
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw, PenTool, Check } from 'lucide-react';

const PAD_HEIGHT = 180;

export default function SignaturePad({
  title = 'Assinatura',
  signerLabel = '',
  onSave,
  initialSignature = null,
  readOnly = false
}) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const activePointerRef = useRef(null);
  const [hasInk, setHasInk] = useState(Boolean(initialSignature));

  /** Prepara o contexto na resolução real do aparelho (traço nítido). */
  const configure = useCallback((canvas) => {
    const ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    const width = canvas.clientWidth || 420;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(PAD_HEIGHT * ratio);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.strokeStyle = '#101828';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }, []);

  // Desenha a assinatura já existente e redesenha ao redimensionar.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let frame = 0;

    const render = () => {
      const ctx = configure(canvas);
      if (!initialSignature) return;
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, canvas.clientWidth, PAD_HEIGHT);
        setHasInk(true);
      };
      image.src = initialSignature;
    };

    render();

    // Redimensionar zera o canvas: guardamos o traço e o repomos.
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const snapshot = hasInk ? canvas.toDataURL('image/png') : null;
        const ctx = configure(canvas);
        if (!snapshot) return;
        const image = new Image();
        image.onload = () => ctx.drawImage(image, 0, 0, canvas.clientWidth, PAD_HEIGHT);
        image.src = snapshot;
      });
    });

    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // `hasInk` fica fora das dependências de propósito: só é lido dentro
    // do observer, e incluí-lo recriaria o observer a cada traço.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSignature, configure]);

  const pointFrom = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handleDown = (event) => {
    if (readOnly || activePointerRef.current !== null) return;
    event.preventDefault();
    activePointerRef.current = event.pointerId;
    // Mantém o traço mesmo se o dedo escapar da área do quadro.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    lastRef.current = pointFrom(event);
  };

  const handleMove = (event) => {
    if (!drawingRef.current || readOnly) return;
    if (activePointerRef.current !== event.pointerId) return;
    event.preventDefault();

    const ctx = canvasRef.current.getContext('2d');
    const point = pointFrom(event);

    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    lastRef.current = point;
    if (!hasInk) setHasInk(true);
  };

  const handleUp = (event) => {
    if (activePointerRef.current !== event.pointerId) return;
    activePointerRef.current = null;
    if (!drawingRef.current) return;
    drawingRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    onSave?.(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onSave?.(null);
  };

  return (
    <div className="sign-block">
      <div className="sign-head">
        <div>
          <span className="sign-title">
            <PenTool size={15} aria-hidden="true" />
            {title}
          </span>
          {signerLabel && <span className="sign-who">{signerLabel}</span>}
        </div>

        {!readOnly && hasInk && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>
            <RotateCcw size={12} aria-hidden="true" />
            Limpar
          </button>
        )}
      </div>

      <div
        className={`sign-pad ${hasInk ? 'is-signed' : ''} ${readOnly ? 'is-readonly' : ''}`}
      >
        <canvas
          ref={canvasRef}
          style={{ height: PAD_HEIGHT }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          aria-label={`Área de assinatura: ${title}`}
        />
        <div className="sign-rule" aria-hidden="true" />
        {!hasInk && !readOnly && (
          <div className="sign-hint">Assine aqui com o dedo ou o mouse</div>
        )}
      </div>

      <div className={`sign-status ${hasInk ? 'is-done' : ''}`}>
        {hasInk ? (
          <>
            <Check size={11} style={{ display: 'inline', verticalAlign: -1 }} aria-hidden="true" />{' '}
            Assinatura capturada
          </>
        ) : (
          'Aguardando assinatura'
        )}
      </div>
    </div>
  );
}
