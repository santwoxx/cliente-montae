import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

export default function SignaturePad({
  title = 'Assinatura',
  signerLabel = 'Nome do Assinante',
  onSave,
  initialSignature = null,
  readOnly = false
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Initialize canvas with high DPI for crisp signature lines
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    
    // Set actual display size in CSS pixels
    const width = rect.width || 420;
    const height = 180;
    
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio);
    ctx.strokeStyle = '#0f172a'; // Deep dark ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasDrawn(true);
      };
      img.src = initialSignature;
    }
  }, [initialSignature]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    if (readOnly) return;
    e.preventDefault();
    const pos = getCoordinates(e);
    lastPos.current = pos;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || readOnly) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const newPos = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();

    lastPos.current = newPos;
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (onSave && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clearCanvas = () => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
    setHasDrawn(false);
    if (onSave) onSave(null);
  };

  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PenTool size={16} color="var(--gold-primary)" />
            {title}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>
            {signerLabel}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={clearCanvas}
            title="Limpar assinatura para assinar novamente"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            <RotateCcw size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="signature-box" style={{ background: '#ffffff', minHeight: '180px' }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ width: '100%', height: '180px', display: 'block', cursor: readOnly ? 'default' : 'crosshair' }}
        />
        <div className="signature-guide" />
        {!hasDrawn && !readOnly && (
          <div className="signature-placeholder">
            <span>✍️ Toque com o dedo ou mouse para assinar</span>
          </div>
        )}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
        {hasDrawn ? '✓ Assinatura digital capturada com sucesso' : 'Aguardando assinatura digital'}
      </div>
    </div>
  );
}
