import { useState, useRef, useEffect, useCallback } from 'react';

const ImageCropModal = ({ file, onCrop, onCancel, aspect = 1, type = 'avatar' }) => {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });

  const isCircle = type === 'avatar';

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    const size = 400;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW, drawH;
    if (imgAspect > 1) {
      drawH = size * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = size * scale;
      drawH = drawW / imgAspect;
    }

    const x = (size - drawW) / 2 + offset.x;
    const y = (size - drawH) / 2 + offset.y;

    if (isCircle) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(img, x, y, drawW, drawH);
  }, [scale, offset, isCircle, imgLoaded]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((s) => Math.min(Math.max(s + delta, 0.5), 3));
  };

  const handlePointerDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setDragging(false);

  const handleCrop = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const outSize = type === 'avatar' ? 512 : 1920;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outSize;
    outCanvas.height = type === 'avatar' ? outSize : Math.round(outSize / aspect);
    const ctx = outCanvas.getContext('2d');

    const srcSize = 400;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW, drawH;
    if (imgAspect > 1) {
      drawH = srcSize * scale;
      drawW = drawH * imgAspect;
    } else {
      drawW = srcSize * scale;
      drawH = drawW / imgAspect;
    }
    const sx = ((srcSize - drawW) / 2 + offset.x) * (img.naturalWidth / srcSize);
    const sy = ((srcSize - drawH) / 2 + offset.y) * (img.naturalHeight / srcSize);
    const sw = drawW * (img.naturalWidth / srcSize);
    const sh = drawH * (img.naturalHeight / srcSize);

    if (isCircle) {
      ctx.beginPath();
      ctx.arc(outSize / 2, outSize / 2, outSize / 2, 0, Math.PI * 2);
      ctx.clip();
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outCanvas.width, outCanvas.height);

    outCanvas.toBlob((blob) => {
      if (blob) {
        const croppedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
        onCrop(croppedFile);
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h3 className="font-semibold text-stone-900">
            {type === 'avatar' ? 'Crop Profile Picture' : 'Crop Cover Image'}
          </h3>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          <div
            ref={containerRef}
            className="relative mx-auto bg-stone-100 overflow-hidden select-none"
            style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: isCircle ? '50%' : '0.5rem',
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            {!isCircle && (
              <div className="absolute inset-0 border-2 border-white/50 rounded-lg pointer-events-none" />
            )}
          </div>

          <p className="text-xs text-stone-400 text-center mt-3">
            Scroll to zoom. Drag to position.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={onCancel}
            className="rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="rounded-lg bg-[#000] px-5 py-2 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
          >
            {type === 'avatar' ? 'Use This Photo' : 'Use This Cover'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
