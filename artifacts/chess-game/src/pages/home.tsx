import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useCreateGame } from '@workspace/api-client-react';
import { PlayerColor, GameResult, useChess } from '@/hooks/use-chess';
import { ChessBoard } from '@/components/chessboard';
import { MoveHistory } from '@/components/move-history';
import { CapturedPieces } from '@/components/captured-pieces';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Flag, Play, List, Handshake, Users } from 'lucide-react';
import { getListGamesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createGame = useCreateGame();
  
  const [playerColor, setPlayerColor] = useState<PlayerColor>('white');
  const [difficulty, setDifficulty] = useState<number>(10);
  
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalResult, setModalResult] = useState<GameResult>(null);

  const handleGameOver = (result: GameResult, pgn: string) => {
    setModalResult(result);
    setShowResultModal(true);
    
    // Save to API
    createGame.mutate({
      data: {
        pgn,
        result: result || 'draw',
        playerColor,
        difficulty
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });
      }
    });
  };

  const {
    chess,
    history,
    lastMove,
    isEngineThinking,
    isGameOver,
    makeMove,
    resign,
    offerDraw,
    resetGame
  } = useChess({
    playerColor,
    difficulty,
    onGameOver: handleGameOver
  });

  const topColor = playerColor === 'white' ? 'b' : 'w';
  const bottomColor = playerColor === 'white' ? 'w' : 'b';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-inner">
              <img src="/pieces/bN.svg" alt="chess knight" className="w-6 h-6 object-contain" draggable={false} />
            </div>
            <h1 className="font-serif font-semibold text-lg tracking-wide text-primary">CHESS</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/multiplayer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Users className="w-4 h-4" />
              Play Online
            </Link>
            <Link href="/review" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <List className="w-4 h-4" />
              Games
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        
        {/* Left Column: Settings & Board */}
        <div className="flex flex-col gap-6">
          
          <Card className="bg-card shadow-md border-border/50">
            <CardContent className="p-4 flex flex-wrap gap-4 items-end">
              <div className="space-y-1.5 flex-1 min-w-[120px]">
                <Label htmlFor="color-select" className="text-xs text-muted-foreground uppercase tracking-wider">Play as</Label>
                <Select 
                  value={playerColor} 
                  onValueChange={(v) => setPlayerColor(v as PlayerColor)}
                  disabled={history.length > 0 && !isGameOver}
                >
                  <SelectTrigger id="color-select" className="bg-background">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="black">Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 flex-1 min-w-[120px]">
                <Label htmlFor="difficulty-select" className="text-xs text-muted-foreground uppercase tracking-wider">Difficulty (Elo)</Label>
                <Select 
                  value={difficulty.toString()} 
                  onValueChange={(v) => setDifficulty(parseInt(v))}
                  disabled={history.length > 0 && !isGameOver}
                >
                  <SelectTrigger id="difficulty-select" className="bg-background">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(20)].map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString()}>
                        Level {i+1} (~{1000 + i * 50} Elo)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={resetGame} 
                variant="default"
                className="w-full sm:w-auto font-medium"
              >
                <Play className="w-4 h-4 mr-2" />
                New Game
              </Button>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center">
            <div className="w-full max-w-[600px] flex flex-col gap-2">
              
              {/* Opponent Info */}
              <div className="flex justify-between items-center px-4 bg-muted/30 py-2 rounded-t-md border-x border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-black flex items-center justify-center shadow-inner">
                    <span className="text-white text-xl">🤖</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Stockfish Level {difficulty}</div>
                    <div className="text-xs text-muted-foreground h-4 flex items-center">
                      {isEngineThinking ? (
                        <span className="flex gap-1">Thinking<span className="animate-pulse">...</span></span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <CapturedPieces history={history} color={topColor} />
              </div>

              {/* The Board */}
              <ChessBoard 
                chess={chess}
                playerColor={playerColor}
                onMove={makeMove}
                lastMove={lastMove}
              />

              {/* Player Info */}
              <div className="flex justify-between items-center px-4 bg-muted/30 py-2 rounded-b-md border-x border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-white border border-gray-300 flex items-center justify-center shadow-inner">
                    <span className="text-black text-xl">👤</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">You</div>
                    <div className="text-xs text-muted-foreground h-4">
                      {history.length === 0 ? "Ready to play" : ""}
                    </div>
                  </div>
                </div>
                <CapturedPieces history={history} color={bottomColor} />
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Notation & Controls */}
        <div className="flex flex-col gap-6">
          <Card className="flex-1 flex flex-col bg-card shadow-md border-border/50 overflow-hidden min-h-[300px]">
            <CardHeader className="py-3 px-4 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-sm font-serif font-medium flex items-center justify-between">
                <span>Move History</span>
                <span className="text-xs font-sans text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border">
                  {history.length} moves
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <MoveHistory history={history} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border/50 shadow-sm"
              disabled={history.length === 0 || isGameOver}
              onClick={offerDraw}
            >
              <Handshake className="w-4 h-4 mr-2" />
              Offer Draw
            </Button>
            <Button 
              variant="outline" 
              className="bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-border/50 shadow-sm"
              disabled={history.length === 0 || isGameOver}
              onClick={resign}
            >
              <Flag className="w-4 h-4 mr-2" />
              Resign
            </Button>
          </div>
        </div>

      </main>

      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center text-primary">Game Over</DialogTitle>
            <DialogDescription className="text-center pt-2 text-base">
              {modalResult === 'draw' ? (
                "The game ended in a draw."
              ) : modalResult === playerColor ? (
                "Victory! You defeated Stockfish."
              ) : (
                "Defeat. Stockfish wins this time."
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center py-6">
            <div className="text-6xl">
              {modalResult === 'draw' ? '🤝' : modalResult === playerColor ? '🏆' : '☠️'}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowResultModal(false)}>
              View Board
            </Button>
            <Button onClick={() => { setShowResultModal(false); resetGame(); }}>
              Play Again
            </Button>
            <Button variant="secondary" onClick={() => { setLocation('/review'); }}>
              Game Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
