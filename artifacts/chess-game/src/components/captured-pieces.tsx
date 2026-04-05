import { Move } from 'chess.js';
import { cn } from '@/lib/utils';

interface CapturedPiecesProps {
  history: Move[];
  color: 'w' | 'b';
  className?: string;
}

const PIECE_CHARS = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
};

export function CapturedPieces({ history, color, className }: CapturedPiecesProps) {
  // A piece is captured if it's in the 'captured' field of a move
  // If we want captured pieces of color 'w', we look for moves made by 'b' that have a capture
  const enemyColor = color === 'w' ? 'b' : 'w';
  
  const capturedPieces = history
    .filter(m => m.color === enemyColor && m.captured)
    .map(m => m.captured as string);

  if (capturedPieces.length === 0) return <div className={cn("h-6", className)}></div>;

  // Sort by value
  capturedPieces.sort((a, b) => PIECE_VALUES[a] - PIECE_VALUES[b]);

  return (
    <div className={cn("flex items-center text-xl overflow-hidden h-6", className)}>
      {capturedPieces.map((p, i) => (
        <span key={i} className="-ml-1 drop-shadow-sm" style={{ color: color === 'w' ? '#f8f9fa' : '#111827' }}>
          {PIECE_CHARS[color as 'w' | 'b'][p as keyof typeof PIECE_CHARS['w']]}
        </span>
      ))}
    </div>
  );
}
