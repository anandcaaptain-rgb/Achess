import { Move } from 'chess.js';
import { cn } from '@/lib/utils';

interface CapturedPiecesProps {
  history: Move[];
  color: 'w' | 'b';
  className?: string;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
};

function getPieceSrc(color: 'w' | 'b', type: string): string {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

export function CapturedPieces({ history, color, className }: CapturedPiecesProps) {
  const enemyColor = color === 'w' ? 'b' : 'w';

  const capturedPieces = history
    .filter(m => m.color === enemyColor && m.captured)
    .map(m => m.captured as string);

  if (capturedPieces.length === 0) return <div className={cn("h-6", className)}></div>;

  capturedPieces.sort((a, b) => PIECE_VALUES[a] - PIECE_VALUES[b]);

  return (
    <div className={cn("flex items-center overflow-hidden h-6", className)}>
      {capturedPieces.map((p, i) => (
        <img
          key={i}
          src={getPieceSrc(color, p)}
          alt={`${color}${p}`}
          className="-ml-1 h-6 w-6 object-contain drop-shadow-sm"
          draggable={false}
        />
      ))}
    </div>
  );
}
