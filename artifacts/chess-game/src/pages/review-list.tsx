import { Link, useLocation } from 'wouter';
import { useListGames, useDeleteGame, getListGamesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Trash2, ArrowLeft, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function ReviewList() {
  const { data: games, isLoading } = useListGames();
  const deleteGame = useDeleteGame();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGame.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListGamesQueryKey() });
        }
      });
    }
  };

  const sortedGames = games ? [...games].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="font-serif font-semibold text-lg tracking-wide text-primary">GAME ARCHIVE</h1>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        
        <div className="mb-8">
          <h2 className="text-3xl font-serif text-foreground mb-2">Past Matches</h2>
          <p className="text-muted-foreground">Review your previous games against Stockfish.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-md" />
            ))}
          </div>
        ) : sortedGames.length === 0 ? (
          <Card className="bg-card border-border/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <img src="/pieces/bP.svg" alt="pawn" className="w-12 h-12 mb-4 opacity-50" draggable={false} />
              <h3 className="text-lg font-medium mb-1">No saved games</h3>
              <p className="text-muted-foreground text-sm mb-6">Complete a match against Stockfish to save it here.</p>
              <Button asChild>
                <Link href="/">Play a Game</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedGames.map((game) => {
              const isWin = game.result === game.playerColor;
              const isDraw = game.result === 'draw';
              const resultColor = isWin ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 
                                 isDraw ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' : 
                                 'bg-destructive/10 text-destructive hover:bg-destructive/20';
              
              const resultText = isDraw ? 'Draw' : isWin ? 'Victory' : 'Defeat';

              return (
                <Card 
                  key={game.id} 
                  className="group bg-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden"
                  onClick={() => setLocation(`/review/${game.id}`)}
                >
                  <CardContent className="p-0 flex flex-col sm:flex-row items-stretch">
                    
                    <div className="p-4 sm:w-48 flex flex-col justify-center bg-muted/20 border-b sm:border-b-0 sm:border-r border-border/50">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {format(new Date(game.createdAt), 'MMM d, yyyy')}
                      </div>
                      <Badge variant="outline" className={`w-fit border-none ${resultColor}`}>
                        {resultText}
                      </Badge>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-center gap-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-lg flex items-center gap-2">
                          <span className="capitalize">{game.playerColor}</span> vs Stockfish (Lvl {game.difficulty})
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDelete(game.id, e)}
                            title="Delete game"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ExternalLink className="h-4 w-4 text-muted-foreground opacity-50" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1 font-mono">
                        {game.pgn.substring(0, 60)}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
