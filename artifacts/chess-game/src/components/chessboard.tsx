import React, { useState, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { cn } from '@/lib/utils';

interface ChessBoardProps {
  chess: Chess;
  playerColor: 'white' | 'black';
  onMove?: (from: string, to: string) => boolean;
  lastMove?: { from: string, to: string } | null;
  readOnly?: boolean;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'];

function getPieceSrc(color: 'w' | 'b', type: string): string {
  const colorChar = color === 'w' ? 'w' : 'b';
  const typeChar = type.toUpperCase();
  return `/pieces/${colorChar}${typeChar}.svg`;
}

export function ChessBoard({ chess, playerColor, onMove, lastMove, readOnly = false }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  const board = chess.board();
  const isFlipped = playerColor === 'black';

  const ranks = isFlipped ? [...RANKS].reverse() : RANKS;
  const files = isFlipped ? [...FILES].reverse() : FILES;

  const validMoves = useMemo(() => {
    if (!selectedSquare || readOnly) return [];
    return chess.moves({ square: selectedSquare as Square, verbose: true }).map(m => m.to);
  }, [chess, selectedSquare, readOnly]);

  const handleSquareClick = (square: string) => {
    if (readOnly) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      const moveMade = onMove?.(selectedSquare, square);
      if (moveMade) {
        setSelectedSquare(null);
      } else {
        const piece = chess.get(square as Square);
        if (piece && piece.color === chess.turn()) {
          setSelectedSquare(square);
        } else {
          setSelectedSquare(null);
        }
      }
    } else {
      const piece = chess.get(square as Square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
      }
    }
  };

  const isCheck = chess.isCheck();
  const kingSquare = isCheck ? board.flat().find(p => p?.type === 'k' && p.color === chess.turn())?.square : null;

  return (
    <div className="flex flex-col select-none">
      <div className="grid grid-cols-[auto_1fr] gap-1">
        <div className="flex flex-col justify-around text-xs text-muted-foreground font-mono py-2 pr-2">
          {ranks.map(r => <span key={r} className="h-full flex items-center justify-center">{r}</span>)}
        </div>

        <div className="border-4 border-border rounded-sm overflow-hidden shadow-2xl">
          <div className="grid grid-cols-8 grid-rows-8 aspect-square w-full min-w-[300px] max-w-[600px]">
            {ranks.map((rank, rankIndex) => (
              files.map((file, fileIndex) => {
                const square = `${file}${rank}`;
                const isLight = (rankIndex + fileIndex) % 2 === 0;

                const piece = board[8 - parseInt(rank)][file.charCodeAt(0) - 97];

                const isSelected = selectedSquare === square;
                const isValidMove = validMoves.includes(square);
                const isLastMove = lastMove?.from === square || lastMove?.to === square;
                const isKingInCheck = square === kingSquare;

                return (
                  <div
                    key={square}
                    onClick={() => handleSquareClick(square)}
                    className={cn(
                      "relative flex items-center justify-center cursor-default transition-colors duration-150",
                      isLight ? "bg-board-light" : "bg-board-dark",
                      isLastMove && "after:absolute after:inset-0 after:bg-primary/30",
                      isSelected && "after:absolute after:inset-0 after:bg-primary/50",
                      isKingInCheck && "after:absolute after:inset-0 after:bg-destructive/60",
                      !readOnly && piece?.color === chess.turn() && "cursor-pointer",
                      !readOnly && selectedSquare && isValidMove && "cursor-pointer"
                    )}
                  >
                    {piece && (
                      <img
                        src={getPieceSrc(piece.color, piece.type)}
                        alt={`${piece.color}${piece.type}`}
                        className="relative z-10 w-[85%] h-[85%] object-contain drop-shadow-md pointer-events-none"
                        draggable={false}
                      />
                    )}

                    {isValidMove && (
                      <div className={cn(
                        "absolute z-20 rounded-full bg-black/20",
                        piece ? "w-full h-full border-4 border-black/20 bg-transparent rounded-none" : "w-1/4 h-1/4"
                      )} />
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-1 mt-1">
        <div className="w-4"></div>
        <div className="flex justify-around text-xs text-muted-foreground font-mono px-2">
          {files.map(f => <span key={f} className="w-full flex items-center justify-center">{f}</span>)}
        </div>
      </div>
    </div>
  );
}
