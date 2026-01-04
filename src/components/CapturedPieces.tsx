import { useMemo } from 'react';
import { Chess } from 'chess.js';
import { ChessPiece } from './ChessPiece';

interface CapturedPiecesProps {
  fen: string;
  playerColor: 'white' | 'black';
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
};

const STARTING_PIECES = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
};

type PieceType = 'p' | 'n' | 'b' | 'r' | 'q';

export const useCapturedPieces = ({ fen, playerColor }: CapturedPiecesProps) => {
  const { whiteCaptured, blackCaptured, materialDiff } = useMemo(() => {
    const game = new Chess(fen);
    const board = game.board();
    
    // Count pieces on board
    const whitePieces: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const blackPieces: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    
    for (const row of board) {
      for (const square of row) {
        if (square && square.type !== 'k') {
          if (square.color === 'w') {
            whitePieces[square.type]++;
          } else {
            blackPieces[square.type]++;
          }
        }
      }
    }
    
    // Calculate captured pieces (what white captured from black and vice versa)
    const whiteCaptured: PieceType[] = []; // Pieces white captured (black pieces missing)
    const blackCaptured: PieceType[] = []; // Pieces black captured (white pieces missing)
    
    let whiteMaterial = 0;
    let blackMaterial = 0;
    
    for (const piece of Object.keys(STARTING_PIECES) as PieceType[]) {
      const whiteMissing = STARTING_PIECES[piece] - whitePieces[piece];
      const blackMissing = STARTING_PIECES[piece] - blackPieces[piece];
      
      // Black captured white's missing pieces
      for (let i = 0; i < whiteMissing; i++) {
        blackCaptured.push(piece);
        blackMaterial += PIECE_VALUES[piece];
      }
      
      // White captured black's missing pieces
      for (let i = 0; i < blackMissing; i++) {
        whiteCaptured.push(piece);
        whiteMaterial += PIECE_VALUES[piece];
      }
    }
    
    // Sort by value (highest first)
    const sortByValue = (a: PieceType, b: PieceType) => PIECE_VALUES[b] - PIECE_VALUES[a];
    whiteCaptured.sort(sortByValue);
    blackCaptured.sort(sortByValue);
    
    return {
      whiteCaptured,
      blackCaptured,
      materialDiff: whiteMaterial - blackMaterial,
    };
  }, [fen]);

  const renderCapturedRow = (pieces: PieceType[], capturedBy: 'w' | 'b', advantage: number) => (
    <div className="flex items-center gap-1">
      <div className="flex items-center -space-x-1">
        {pieces.map((piece, i) => (
          <div key={i} className="w-5 h-5 sm:w-6 sm:h-6">
            <ChessPiece piece={piece} color={capturedBy === 'w' ? 'b' : 'w'} size="sm" />
          </div>
        ))}
      </div>
      {advantage > 0 && (
        <span className="text-sm font-semibold text-muted-foreground ml-1">
          +{advantage}
        </span>
      )}
    </div>
  );

  // Show bot's captured pieces at top, player's at bottom
  const topColor = playerColor === 'white' ? 'b' : 'w';
  const bottomColor = playerColor === 'white' ? 'w' : 'b';
  
  const topCaptured = topColor === 'w' ? whiteCaptured : blackCaptured;
  const bottomCaptured = bottomColor === 'w' ? whiteCaptured : blackCaptured;
  
  const topAdvantage = topColor === 'w' ? (materialDiff > 0 ? materialDiff : 0) : (materialDiff < 0 ? -materialDiff : 0);
  const bottomAdvantage = bottomColor === 'w' ? (materialDiff > 0 ? materialDiff : 0) : (materialDiff < 0 ? -materialDiff : 0);

  return {
    top: (
      <div className="min-h-6 flex items-center">
        {topCaptured.length > 0 && renderCapturedRow(topCaptured, topColor, topAdvantage)}
      </div>
    ),
    bottom: (
      <div className="min-h-6 flex items-center">
        {bottomCaptured.length > 0 && renderCapturedRow(bottomCaptured, bottomColor, bottomAdvantage)}
      </div>
    ),
  };
};
