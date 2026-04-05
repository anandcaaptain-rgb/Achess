import { Move } from 'chess.js';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  history: Move[];
}

export function MoveHistory({ history }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (white, black)
  const movePairs: { white: Move; black?: Move; moveNumber: number }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      white: history[i],
      black: history[i + 1],
      moveNumber: Math.floor(i / 2) + 1,
    });
  }

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [history.length]);

  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        No moves yet
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full pr-4">
      <div className="space-y-1 font-mono text-sm">
        {movePairs.map((pair, idx) => (
          <div key={idx} className="flex px-2 py-1 hover:bg-muted/50 rounded-sm transition-colors">
            <span className="w-8 text-muted-foreground">{pair.moveNumber}.</span>
            <span className="flex-1 text-foreground">{pair.white.san}</span>
            <span className="flex-1 text-foreground">{pair.black?.san || ''}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
