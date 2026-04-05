import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import Peer, { DataConnection } from 'peerjs';

export type P2PRole = 'host' | 'guest';
export type P2PStatus = 'idle' | 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'error';
export type GameResult = 'white' | 'black' | 'draw' | null;

interface P2PMessage {
  type: 'move' | 'resign' | 'draw_offer' | 'draw_accept' | 'draw_decline' | 'reset';
  payload?: { from: string; to: string; promotion?: string } | null;
}

interface UseP2PChessProps {
  onGameOver?: (result: GameResult, pgn: string) => void;
}

export function useP2PChess({ onGameOver }: UseP2PChessProps = {}) {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [history, setHistory] = useState<Move[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [result, setResult] = useState<GameResult>(null);

  const [peerId, setPeerId] = useState<string | null>(null);
  const [status, setStatus] = useState<P2PStatus>('idle');
  const [role, setRole] = useState<P2PRole | null>(null);
  const [drawOffered, setDrawOffered] = useState(false);

  // host = white, guest = black
  const playerColor = role === 'host' ? 'white' : 'black';

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const syncState = useCallback(() => {
    setFen(chess.fen());
    setHistory(chess.history({ verbose: true }) as Move[]);
  }, [chess]);

  const checkGameOver = useCallback(() => {
    if (chess.isGameOver()) {
      setIsGameOver(true);
      let res: GameResult = 'draw';
      if (chess.isCheckmate()) {
        res = chess.turn() === 'w' ? 'black' : 'white';
      }
      setResult(res);
      onGameOver?.(res, chess.pgn());
    }
  }, [chess, onGameOver]);

  const handleMessage = useCallback((msg: P2PMessage) => {
    if (msg.type === 'move' && msg.payload) {
      try {
        const { from, to, promotion } = msg.payload;
        chess.move({ from, to, promotion: promotion || undefined });
        setLastMove({ from, to });
        syncState();
        checkGameOver();
      } catch (e) {
        console.error('Invalid move received from peer', e);
      }
    } else if (msg.type === 'resign') {
      // opponent resigned
      const res = playerColor === 'white' ? 'white' : 'black';
      setIsGameOver(true);
      setResult(res);
      onGameOver?.(res, chess.pgn());
    } else if (msg.type === 'draw_offer') {
      setDrawOffered(true);
    } else if (msg.type === 'draw_accept') {
      setIsGameOver(true);
      setResult('draw');
      onGameOver?.('draw', chess.pgn());
    } else if (msg.type === 'draw_decline') {
      setDrawOffered(false);
    } else if (msg.type === 'reset') {
      chess.reset();
      setLastMove(null);
      setIsGameOver(false);
      setResult(null);
      setDrawOffered(false);
      syncState();
    }
  }, [chess, playerColor, onGameOver, syncState, checkGameOver]);

  const sendMessage = useCallback((msg: P2PMessage) => {
    connRef.current?.send(msg);
  }, []);

  // Host: create peer and wait for connection
  const createGame = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    chess.reset();
    setLastMove(null);
    setIsGameOver(false);
    setResult(null);
    syncState();

    setRole('host');
    setStatus('connecting');

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setStatus('waiting');
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setStatus('connected');
      conn.on('data', (data) => handleMessage(data as P2PMessage));
      conn.on('close', () => setStatus('disconnected'));
      conn.on('error', () => setStatus('error'));
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setStatus('error');
    });
  }, [chess, syncState, handleMessage]);

  // Guest: connect to host using their peer ID
  const joinGame = useCallback((hostId: string) => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    chess.reset();
    setLastMove(null);
    setIsGameOver(false);
    setResult(null);
    syncState();

    setRole('guest');
    setStatus('connecting');

    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', () => {
      const conn = peer.connect(hostId.trim(), { reliable: true });
      connRef.current = conn;

      conn.on('open', () => {
        setStatus('connected');
      });
      conn.on('data', (data) => handleMessage(data as P2PMessage));
      conn.on('close', () => setStatus('disconnected'));
      conn.on('error', () => setStatus('error'));
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
      setStatus('error');
    });
  }, [chess, syncState, handleMessage]);

  const makeMove = useCallback((from: string, to: string, promotion?: string) => {
    if (isGameOver || status !== 'connected') return false;
    // Only allow moves on our turn
    if ((chess.turn() === 'w' && playerColor === 'black') ||
        (chess.turn() === 'b' && playerColor === 'white')) return false;

    try {
      chess.move({ from, to, promotion: promotion || 'q' });
      setLastMove({ from, to });
      syncState();
      sendMessage({ type: 'move', payload: { from, to, promotion } });
      checkGameOver();
      return true;
    } catch {
      return false;
    }
  }, [chess, isGameOver, status, playerColor, syncState, sendMessage, checkGameOver]);

  const resign = useCallback(() => {
    if (isGameOver) return;
    sendMessage({ type: 'resign' });
    const res = playerColor === 'white' ? 'black' : 'white';
    setIsGameOver(true);
    setResult(res);
    onGameOver?.(res, chess.pgn());
  }, [isGameOver, playerColor, chess, sendMessage, onGameOver]);

  const offerDraw = useCallback(() => {
    if (isGameOver) return;
    sendMessage({ type: 'draw_offer' });
  }, [isGameOver, sendMessage]);

  const acceptDraw = useCallback(() => {
    sendMessage({ type: 'draw_accept' });
    setIsGameOver(true);
    setResult('draw');
    setDrawOffered(false);
    onGameOver?.('draw', chess.pgn());
  }, [sendMessage, chess, onGameOver]);

  const declineDraw = useCallback(() => {
    sendMessage({ type: 'draw_decline' });
    setDrawOffered(false);
  }, [sendMessage]);

  const resetGame = useCallback(() => {
    chess.reset();
    setLastMove(null);
    setIsGameOver(false);
    setResult(null);
    setDrawOffered(false);
    syncState();
    sendMessage({ type: 'reset' });
  }, [chess, syncState, sendMessage]);

  const disconnect = useCallback(() => {
    peerRef.current?.destroy();
    peerRef.current = null;
    connRef.current = null;
    setStatus('idle');
    setRole(null);
    setPeerId(null);
  }, []);

  useEffect(() => {
    return () => {
      peerRef.current?.destroy();
    };
  }, []);

  return {
    chess,
    fen,
    history,
    lastMove,
    isGameOver,
    result,
    playerColor,
    peerId,
    status,
    role,
    drawOffered,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    resetGame,
    createGame,
    joinGame,
    disconnect,
  };
}
