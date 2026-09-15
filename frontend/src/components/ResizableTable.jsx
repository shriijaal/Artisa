import { useState, useRef, useCallback, useEffect } from 'react';

export default function ResizableTable({ columns, children, className = '' }) {
  const [colWidths, setColWidths] = useState(() => columns.map((c) => c.width || 150));
  const dragging = useRef(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  const onMouseDown = useCallback((index, e) => {
    dragging.current = index;
    startX.current = e.clientX;
    startWidth.current = colWidths[index];
    e.preventDefault();
  }, [colWidths]);

  useEffect(() => {
    const onMouseMove = (e) => {
      if (dragging.current === null) return;
      const diff = e.clientX - startX.current;
      const newWidth = Math.max(60, startWidth.current + diff);
      setColWidths((prev) => {
        const next = [...prev];
        next[dragging.current] = newWidth;
        return next;
      });
    };
    const onMouseUp = () => { dragging.current = null; };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full" style={{ minWidth: colWidths.reduce((a, b) => a + b, 0) }}>
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            {columns.map((col, i) => (
              <th
                key={col.key}
                className="relative text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider select-none group/th"
                style={{ width: colWidths[i], minWidth: 60 }}
              >
                <div className="flex items-center pr-3">
                  <span className="truncate">{col.label}</span>
                </div>
                {i < columns.length - 1 && (
                  <div
                    onMouseDown={(e) => onMouseDown(i, e)}
                    className="absolute top-0 right-0 h-full w-4 cursor-col-resize z-10 flex items-center justify-center hover:bg-amber-100 transition-colors"
                    title="Drag to resize"
                  >
                    <div className="h-4 w-px bg-stone-300 group-hover/th:bg-amber-500 transition-colors" />
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {children}
        </tbody>
      </table>
    </div>
  );
}
