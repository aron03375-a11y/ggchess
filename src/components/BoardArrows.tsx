import { useCallback, useEffect, useRef, useState } from 'react';

interface Arrow {
  from: string;
  to: string;
}

interface BoardArrowsProps {
  boardRef: React.RefObject<HTMLDivElement>;
  playerColor: 'white' | 'black';
  onClearArrows: () => void;
  arrows: Arrow[];
  setArrows: React.Dispatch<React.SetStateAction<Arrow[]>>;
}

export const BoardArrows = ({ boardRef, playerColor, arrows, setArrows }: BoardArrowsProps) => {
  const [drawingArrow, setDrawingArrow] = useState<{ from: string; toPos: { x: number; y: number } } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  const displayFiles = playerColor === 'black' ? [...files].reverse() : files;
  const displayRanks = playerColor === 'black' ? [...ranks].reverse() : ranks;

  const getSquareFromPoint = useCallback((x: number, y: number): string | null => {
    if (!boardRef.current) return null;
    
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    
    const col = Math.floor((x - rect.left) / squareSize);
    const row = Math.floor((y - rect.top) / squareSize);
    
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    
    const file = displayFiles[col];
    const rank = displayRanks[row];
    
    return `${file}${rank}`;
  }, [displayFiles, displayRanks, boardRef]);

  const getSquareCenter = useCallback((square: string): { x: number; y: number } | null => {
    if (!boardRef.current) return null;
    
    const rect = boardRef.current.getBoundingClientRect();
    const squareSize = rect.width / 8;
    
    const file = square[0];
    const rank = square[1];
    
    const col = displayFiles.indexOf(file);
    const row = displayRanks.indexOf(rank);
    
    if (col === -1 || row === -1) return null;
    
    return {
      x: col * squareSize + squareSize / 2,
      y: row * squareSize + squareSize / 2,
    };
  }, [displayFiles, displayRanks, boardRef]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 2) return; // Only right click
    
    const square = getSquareFromPoint(e.clientX, e.clientY);
    if (!square || !boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    setDrawingArrow({
      from: square,
      toPos: { x: e.clientX - rect.left, y: e.clientY - rect.top }
    });
  }, [getSquareFromPoint, boardRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!drawingArrow || !boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    setDrawingArrow(prev => prev ? {
      ...prev,
      toPos: { x: e.clientX - rect.left, y: e.clientY - rect.top }
    } : null);
  }, [drawingArrow, boardRef]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (e.button !== 2 || !drawingArrow) return;
    
    const toSquare = getSquareFromPoint(e.clientX, e.clientY);
    
    if (toSquare && toSquare !== drawingArrow.from) {
      // Toggle arrow - remove if exists, add if not
      setArrows(prev => {
        const exists = prev.some(a => a.from === drawingArrow.from && a.to === toSquare);
        if (exists) {
          return prev.filter(a => !(a.from === drawingArrow.from && a.to === toSquare));
        }
        return [...prev, { from: drawingArrow.from, to: toSquare }];
      });
    }
    
    setDrawingArrow(null);
  }, [drawingArrow, getSquareFromPoint, setArrows]);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    board.addEventListener('contextmenu', handleContextMenu);
    board.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      board.removeEventListener('contextmenu', handleContextMenu);
      board.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [boardRef, handleContextMenu, handleMouseDown, handleMouseMove, handleMouseUp]);

  const renderArrow = (from: { x: number; y: number }, to: { x: number; y: number }, key: string) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length < 5) return null;

    // Arrow head size - bigger tip
    const headLength = 20;
    const headWidth = 14;
    
    // Shorten the line to account for arrow head
    const ratio = (length - headLength) / length;
    const lineEndX = from.x + dx * ratio;
    const lineEndY = from.y + dy * ratio;
    
    // Calculate arrow head points
    const angle = Math.atan2(dy, dx);
    const headX1 = to.x - headLength * Math.cos(angle - Math.PI / 6);
    const headY1 = to.y - headLength * Math.sin(angle - Math.PI / 6);
    const headX2 = to.x - headLength * Math.cos(angle + Math.PI / 6);
    const headY2 = to.y - headLength * Math.sin(angle + Math.PI / 6);

    return (
      <g key={key}>
        <line
          x1={from.x}
          y1={from.y}
          x2={lineEndX}
          y2={lineEndY}
          stroke="rgba(255, 170, 0, 0.8)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <polygon
          points={`${to.x},${to.y} ${headX1},${headY1} ${headX2},${headY2}`}
          fill="rgba(255, 170, 0, 0.8)"
        />
      </g>
    );
  };

  if (!boardRef.current) return null;

  const rect = boardRef.current.getBoundingClientRect();

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-10"
      width={rect.width}
      height={rect.height}
      style={{ width: rect.width, height: rect.height }}
    >
      {/* Existing arrows */}
      {arrows.map((arrow, i) => {
        const fromCenter = getSquareCenter(arrow.from);
        const toCenter = getSquareCenter(arrow.to);
        if (!fromCenter || !toCenter) return null;
        return renderArrow(fromCenter, toCenter, `arrow-${i}`);
      })}
      
      {/* Currently drawing arrow */}
      {drawingArrow && (() => {
        const fromCenter = getSquareCenter(drawingArrow.from);
        if (!fromCenter) return null;
        return renderArrow(fromCenter, drawingArrow.toPos, 'drawing');
      })()}
    </svg>
  );
};
