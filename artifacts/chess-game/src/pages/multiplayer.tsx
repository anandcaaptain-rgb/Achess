import { useState } from 'react';
import { Link } from 'wouter';
import { useP2PChess } from '@/hooks/use-p2p-chess';
import { ChessBoard } from '@/components/chessboard';
import { MoveHistory } from '@/components/move-history';
import { CapturedPieces } from '@/components/captured-pieces';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Flag, Handshake, List, Copy, Check, Wifi, WifiOff, RefreshCw, Users } from 'lucide-react';
import { useCreateGame, getListGamesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

export default function Multiplayer() {
  const queryClient = useQueryClient();
  const createGame = useCreateGame();

  const [joinId, setJoinId] = useState('');
  const [copied, setCopied] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalResult, setModalResult] = useState<'white' | 'black' | 'draw' | null>(null);
  const [drawOfferSent, setDrawOfferSent] = useState(false);

  const handleGameOver = (result: 'white' | 'black' | 'draw' | null, pgn: string) => {
    if (!result) return;
    setModalResult(result);
    setShowResultModal(true);
    createGame.mutate({
      data: { pgn, result, playerColor, difficulty: 0 }
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() })
    });
  };

  const {
    chess, fen, history, lastMove, isGameOver, result,
    playerColor, peerId, status, role, drawOffered,
    makeMove, resign, offerDraw, acceptDraw, declineDraw,
    resetGame, createGame: hostGame, joinGame, disconnect,
  } = useP2PChess({ onGameOver: handleGameOver });

  const copyCode = () => {
    if (peerId) {
      navigator.clipboard.writeText(peerId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOfferDraw = () => {
    offerDraw();
    setDrawOfferSent(true);
    setTimeout(() => setDrawOfferSent(false), 5000);
  };

  const topColor = playerColor === 'white' ? 'b' : 'w';
  const bottomColor = playerColor === 'white' ? 'w' : 'b';
  const opponentLabel = role === 'host' ? 'Guest (Black)' : 'Host (White)';
  const myLabel = role === 'host' ? 'You (White)' : 'You (Black)';

  const statusColor: Record<string, string> = {
    idle: 'bg-muted text-muted-foreground',
    connecting: 'bg-yellow-500/20 text-yellow-400',
    waiting: 'bg-yellow-500/20 text-yellow-400',
    connected: 'bg-green-500/20 text-green-400',
    disconnected: 'bg-destructive/20 text-destructive',
    error: 'bg-destructive/20 text-destructive',
  };

  const statusLabel: Record<string, string> = {
    idle: 'Not connected',
    connecting: 'Connecting...',
    waiting: 'Waiting for opponent...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    error: 'Connection error',
  };

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold font-serif text-xl shadow-inner">
              ♞
            </div>
            <h1 className="font-serif font-semibold text-lg tracking-wide text-primary">CHESS</h1>
          </div>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              vs Stockfish
            </Link>
            <Link href="/review" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <List className="w-4 h-4" />
              Games
            </Link>
          </nav>
        </div>
      </header>

      {status === 'idle' ? (
        /* ── Lobby ── */
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-serif text-3xl font-semibold text-foreground">Play Online</h2>
              <p className="text-muted-foreground mt-2 text-sm">Challenge a friend over a peer-to-peer connection. No account needed.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                className="bg-card border-border/50 shadow-md cursor-pointer hover:border-primary/50 transition-colors group"
                onClick={hostGame}
                data-testid="button-host-game"
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                    <Wifi className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Host a Game</h3>
                  <p className="text-xs text-muted-foreground">Create a room and share the code with your opponent. You play as White.</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border/50 shadow-md">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-3">
                    <WifiOff className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-3 text-center">Join a Game</h3>
                  <div className="space-y-2">
                    <Label htmlFor="join-code" className="text-xs text-muted-foreground">Room Code</Label>
                    <Input
                      id="join-code"
                      placeholder="Paste code here..."
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      className="bg-background text-xs font-mono"
                      data-testid="input-join-code"
                    />
                    <Button
                      className="w-full"
                      size="sm"
                      variant="secondary"
                      disabled={!joinId.trim()}
                      onClick={() => joinGame(joinId)}
                      data-testid="button-join-game"
                    >
                      Join as Black
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Connections are direct peer-to-peer. Your moves are not relayed through any external server.
            </p>
          </div>
        </main>
      ) : (
        /* ── Game ── */
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">

          {/* Left: Board */}
          <div className="flex flex-col gap-4">

            {/* Connection status bar */}
            <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-md bg-card border border-border/50 shadow-sm">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor[status]}`}>
                  {statusLabel[status]}
                </span>
                {status === 'waiting' && peerId && (
                  <span className="text-xs text-muted-foreground">
                    Share code with your opponent
                  </span>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-muted-foreground hover:text-destructive"
                onClick={disconnect}
                data-testid="button-disconnect"
              >
                Leave
              </Button>
            </div>

            {/* Room code (waiting state) */}
            {status === 'waiting' && peerId && (
              <Card className="bg-primary/5 border-primary/20 shadow-sm">
                <CardContent className="p-4">
                  <Label className="text-xs text-primary/70 uppercase tracking-wider">Your Room Code</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="flex-1 font-mono text-sm bg-background px-3 py-2 rounded border border-border/50 text-foreground truncate" data-testid="text-room-code">
                      {peerId}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyCode} className="shrink-0" data-testid="button-copy-code">
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Send this code to your opponent. The game starts when they connect.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Draw offer incoming */}
            {drawOffered && (
              <Card className="bg-yellow-500/10 border-yellow-500/30 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-yellow-400">Your opponent offered a draw.</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={declineDraw} data-testid="button-decline-draw">Decline</Button>
                    <Button size="sm" onClick={acceptDraw} data-testid="button-accept-draw">Accept</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-col items-center">
              <div className="w-full max-w-[600px] flex flex-col gap-2">

                {/* Opponent */}
                <div className="flex justify-between items-center px-4 bg-muted/30 py-2 rounded-t-md border-x border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center shadow-inner">
                      <span className="font-serif text-lg">{topColor === 'b' ? '♟' : '♙'}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{opponentLabel}</div>
                      <div className="text-xs text-muted-foreground h-4">
                        {status === 'connected' && !isGameOver &&
                          ((chess.turn() === 'w' && playerColor === 'black') || (chess.turn() === 'b' && playerColor === 'white'))
                          ? <span className="text-primary animate-pulse">Thinking...</span>
                          : null}
                      </div>
                    </div>
                  </div>
                  <CapturedPieces history={history} color={topColor} />
                </div>

                <ChessBoard
                  chess={chess}
                  playerColor={playerColor}
                  onMove={status === 'connected' ? makeMove : undefined}
                  lastMove={lastMove}
                  readOnly={status !== 'connected' || isGameOver}
                />

                {/* Player */}
                <div className="flex justify-between items-center px-4 bg-muted/30 py-2 rounded-b-md border-x border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center shadow-inner">
                      <span className="font-serif text-lg text-primary-foreground">{bottomColor === 'w' ? '♙' : '♟'}</span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{myLabel}</div>
                      <div className="text-xs text-muted-foreground h-4">
                        {status === 'connected' && !isGameOver &&
                          ((chess.turn() === 'w' && playerColor === 'white') || (chess.turn() === 'b' && playerColor === 'black'))
                          ? <span className="text-primary animate-pulse">Your turn</span>
                          : null}
                      </div>
                    </div>
                  </div>
                  <CapturedPieces history={history} color={bottomColor} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Notation & Controls */}
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
                disabled={history.length === 0 || isGameOver || status !== 'connected' || drawOfferSent}
                onClick={handleOfferDraw}
                data-testid="button-offer-draw"
              >
                <Handshake className="w-4 h-4 mr-2" />
                {drawOfferSent ? 'Offered...' : 'Offer Draw'}
              </Button>
              <Button
                variant="outline"
                className="bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-border/50 shadow-sm"
                disabled={history.length === 0 || isGameOver || status !== 'connected'}
                onClick={resign}
                data-testid="button-resign"
              >
                <Flag className="w-4 h-4 mr-2" />
                Resign
              </Button>
            </div>

            {isGameOver && (
              <Button
                variant="secondary"
                onClick={resetGame}
                className="w-full"
                data-testid="button-rematch"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Rematch
              </Button>
            )}
          </div>
        </main>
      )}

      {/* Result modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-center text-primary">Game Over</DialogTitle>
            <DialogDescription className="text-center pt-2 text-base">
              {modalResult === 'draw'
                ? 'The game ended in a draw.'
                : modalResult === playerColor
                  ? 'Victory! You won the game.'
                  : 'Defeat. Better luck next time.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <span className="text-7xl font-serif text-primary">
              {modalResult === 'draw' ? '½' : modalResult === playerColor ? '1' : '0'}
            </span>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setShowResultModal(false)}>View Board</Button>
            <Button onClick={() => { setShowResultModal(false); resetGame(); }}>Rematch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
