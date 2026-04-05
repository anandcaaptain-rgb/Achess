import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';

export type PlayerColor = 'white' | 'black';
export type GameResult = 'white' | 'black' | 'draw' | null;

interface UseChessProps {
  playerColor: PlayerColor;
  difficulty: number; // 1-20
  onGameOver?: (result: GameResult, pgn: string) => void;
  readOnly?: boolean;
  initialPgn?: string;
}

export function useChess({ playerColor, difficulty, onGameOver, readOnly = false, initialPgn }: UseChessProps) {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<{ from: string, to: string } | null>(null);
  const [isEngineThinking, setIsEngineThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [result, setResult] = useState<GameResult>(null);
  const [history, setHistory] = useState<Move[]>([]);

  const engineRef = useRef<Worker | null>(null);

  // Initialize game
  useEffect(() => {
    if (initialPgn) {
      try {
        chess.loadPgn(initialPgn);
      } catch (e) {
        console.error("Failed to load PGN", e);
      }
    } else {
      chess.reset();
    }
    setFen(chess.fen());
    setHistory(chess.history({ verbose: true }) as Move[]);
    
    if (initialPgn) {
      const moves = chess.history({ verbose: true }) as Move[];
      if (moves.length > 0) {
         setLastMove({ from: moves[moves.length - 1].from, to: moves[moves.length - 1].to });
      }
    } else {
      setLastMove(null);
    }
    setIsGameOver(chess.isGameOver());
    checkGameOver();
  }, [chess, initialPgn]);

  // Initialize Stockfish
  useEffect(() => {
    if (readOnly) return;
    
    let engine: Worker | null = null;
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const workerUrl = `${basePath}stockfish.js`.replace('//', '/');
      engine = new Worker(workerUrl);
      engineRef.current = engine;

      engine.onerror = (e) => {
        console.warn("Stockfish worker error:", e.message);
        setIsEngineThinking(false);
      };

      engine.onmessage = (event: any) => {
        const line = typeof event === 'string' ? event : event.data;
        if (!line) return;

        const match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
        if (match) {
          const from = match[1];
          const to = match[2];
          const promotion = match[3];

          try {
            chess.move({ from, to, promotion: promotion || undefined });
            setFen(chess.fen());
            setHistory(chess.history({ verbose: true }) as Move[]);
            setLastMove({ from, to });
            setIsEngineThinking(false);
            checkGameOver();
          } catch (e) {
            console.error("Engine sent invalid move", line, e);
            setIsEngineThinking(false);
          }
        }
      };

      engine.postMessage('uci');
      engine.postMessage('isready');
    } catch (err) {
      console.warn("Failed to initialize Stockfish worker:", err);
    }

    return () => {
      engine?.postMessage('quit');
      engine?.terminate();
    };
  }, [readOnly, chess]);

  const checkGameOver = useCallback(() => {
    if (chess.isGameOver()) {
      setIsGameOver(true);
      let res: GameResult = 'draw';
      if (chess.isCheckmate()) {
        res = chess.turn() === 'w' ? 'black' : 'white';
      }
      setResult(res);
      onGameOver?.(res, chess.pgn());
    } else {
      setIsGameOver(false);
      setResult(null);
    }
  }, [chess, onGameOver]);

  const makeMove = useCallback((from: string, to: string, promotion?: string) => {
    if (readOnly || isGameOver || isEngineThinking) return false;
    
    // Only allow moves if it's the player's turn
    if ((chess.turn() === 'w' && playerColor === 'black') ||
        (chess.turn() === 'b' && playerColor === 'white')) {
      return false;
    }

    try {
      const move = chess.move({ from, to, promotion: promotion || 'q' });
      setFen(chess.fen());
      setHistory(chess.history({ verbose: true }) as Move[]);
      setLastMove({ from, to });
      checkGameOver();
      return true;
    } catch (e) {
      return false; // invalid move
    }
  }, [chess, readOnly, isGameOver, isEngineThinking, playerColor, checkGameOver]);

  // Engine turn
  useEffect(() => {
    if (readOnly || isGameOver) return;

    const isEngineTurn = (chess.turn() === 'w' && playerColor === 'black') ||
                         (chess.turn() === 'b' && playerColor === 'white');

    if (isEngineTurn && engineRef.current) {
      setIsEngineThinking(true);
      // movetime in ms: level 1 = 300ms, level 20 = 3000ms — gives a human-feeling pace
      const movetime = Math.round(200 + difficulty * 140);
      const depth = Math.max(1, Math.min(12, Math.ceil(difficulty / 2)));
      engineRef.current.postMessage(`position fen ${chess.fen()}`);
      engineRef.current.postMessage(`go movetime ${movetime} depth ${depth}`);
    }
  }, [fen, playerColor, readOnly, isGameOver, difficulty, chess]);

  const resign = useCallback(() => {
    if (readOnly || isGameOver) return;
    setIsGameOver(true);
    const res = playerColor === 'white' ? 'black' : 'white';
    setResult(res);
    onGameOver?.(res, chess.pgn());
  }, [readOnly, isGameOver, playerColor, onGameOver, chess]);

  const offerDraw = useCallback(() => {
    if (readOnly || isGameOver) return;
    setIsGameOver(true);
    setResult('draw');
    onGameOver?.('draw', chess.pgn());
  }, [readOnly, isGameOver, onGameOver, chess]);

  const resetGame = useCallback(() => {
    chess.reset();
    setFen(chess.fen());
    setHistory([]);
    setLastMove(null);
    setIsGameOver(false);
    setResult(null);
    setIsEngineThinking(false);
  }, [chess]);

  return {
    chess,
    fen,
    history,
    lastMove,
    isEngineThinking,
    isGameOver,
    result,
    makeMove,
    resign,
    offerDraw,
    resetGame
  };
}
