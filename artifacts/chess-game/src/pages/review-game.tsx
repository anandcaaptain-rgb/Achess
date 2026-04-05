import { useState, useEffect } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetGame, getGetGameQueryKey } from '@workspace/api-client-react';
import { Chess, Move } from 'chess.js';
import { ChessBoard } from '@/components/chessboard';
import { MoveHistory } from '@/components/move-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ChevronLeft, ChevronRight, SkipBack, SkipForward } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function ReviewGame() {
  const [, params] = useRoute('/review/:id');
  const gameId = parseInt(params?.id || '0', 10);
  
  const { data: game, isLoading, error } = useGetGame(gameId, {
    query: {
      enabled: !!gameId,
      queryKey: getGetGameQueryKey(gameId)
    }
  });

  const [chess] = useState(() => new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [moves, setMoves] = useState<Move[]>([]);
  const [displayedFen, setDisplayedFen] = useState<string>('');
  const [lastMoveHighlight, setLastMoveHighlight] = useState<{from: string, to: string} | null>(null);

  useEffect(() => {
    if (game?.pgn) {
      try {
        chess.loadPgn(game.pgn);
        const history = chess.history({ verbose: true }) as Move[];
        setMoves(history);
        setCurrentMoveIndex(history.length - 1);
      } catch (e) {
        console.error("Invalid PGN", e);
      }
    }
  }, [game?.pgn, chess]);

  useEffect(() => {
    const tempChess = new Chess();
    if (currentMoveIndex >= 0 && moves.length > 0) {
      for (let i = 0; i <= currentMoveIndex; i++) {
        tempChess.move(moves[i]);
      }
      setDisplayedFen(tempChess.fen());
      setLastMoveHighlight({ from: moves[currentMoveIndex].from, to: moves[currentMoveIndex].to });
    } else {
      setDisplayedFen(tempChess.fen());
      setLastMoveHighlight(null);
    }
  }, [currentMoveIndex, moves]);

  // Create a display chess instance bound to the current step
  const displayChess = new Chess(displayedFen || undefined);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Skeleton className="h-[600px] w-[800px]" /></div>;
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground gap-4">
        <h2 className="text-2xl font-serif">Game not found</h2>
        <Button asChild><Link href="/review">Back to Archive</Link></Button>
      </div>
    );
  }

  const isWin = game.result === game.playerColor;
  const isDraw = game.result === 'draw';
  const resultText = isDraw ? 'Draw' : isWin ? 'Victory' : 'Defeat';

  const goToStart = () => setCurrentMoveIndex(-1);
  const goToEnd = () => setCurrentMoveIndex(moves.length - 1);
  const goPrev = () => setCurrentMoveIndex(prev => Math.max(-1, prev - 1));
  const goNext = () => setCurrentMoveIndex(prev => Math.min(moves.length - 1, prev + 1));

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/review">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="font-serif font-semibold text-lg tracking-wide text-primary">GAME REVIEW</h1>
              <Badge variant="outline" className="border-border/50 text-muted-foreground font-mono">
                {format(new Date(game.createdAt), 'MMM d, yyyy')}
              </Badge>
            </div>
          </div>
          <Badge variant="outline" className={
            isWin ? 'border-green-500/30 text-green-500' : 
            isDraw ? 'border-yellow-500/30 text-yellow-500' : 
            'border-destructive/30 text-destructive'
          }>
            {resultText}
          </Badge>
        </div>
      </header>

      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        
        {/* Left Column: Board */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-full flex justify-between px-2">
            <div className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              {game.playerColor === 'black' ? 'You (Black)' : `Stockfish Lvl ${game.difficulty} (Black)`}
            </div>
          </div>

          <div className="w-full max-w-[600px]">
            <ChessBoard 
              chess={displayChess}
              playerColor={game.playerColor as 'white' | 'black'}
              readOnly={true}
              lastMove={lastMoveHighlight}
            />
          </div>

          <div className="w-full flex justify-between px-2">
            <div className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              {game.playerColor === 'white' ? 'You (White)' : `Stockfish Lvl ${game.difficulty} (White)`}
            </div>
          </div>

          {/* Player Controls */}
          <Card className="w-full max-w-[600px] bg-card border-border/50 shadow-md">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="text-sm font-mono text-muted-foreground w-20 text-center">
                {currentMoveIndex + 1} / {moves.length}
              </div>
              <div className="flex gap-2 flex-1 justify-center">
                <Button variant="outline" size="icon" onClick={goToStart} disabled={currentMoveIndex === -1}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goPrev} disabled={currentMoveIndex === -1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goNext} disabled={currentMoveIndex === moves.length - 1}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToEnd} disabled={currentMoveIndex === moves.length - 1}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Notation */}
        <div className="flex flex-col h-full max-h-[800px]">
          <Card className="flex-1 flex flex-col bg-card shadow-md border-border/50 overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-serif font-medium">Full Match Notation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              <MoveHistory history={moves} />
              
              {/* Highlight the active move */}
              <style>{`
                /* We can highlight the current move in the MoveHistory by matching nth-child, but it's simpler to just let the user read it. Since we don't have control over MoveHistory's internal rendering of active state without refactoring it, we'll just show the history. */
              `}</style>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
