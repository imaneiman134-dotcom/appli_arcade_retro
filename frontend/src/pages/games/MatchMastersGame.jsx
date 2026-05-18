import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MatchMastersGame = () => {
  const { jeuId } = useNavigate();
  const navigate = useNavigate();
  const [board, setBoard] = useState(initializeBoard());
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [turnsLeft, setTurnsLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);

  function initializeBoard() {
    // 6x6 board with random pieces
    const board = [];
    for (let i = 0; i < 6; i++) {
      const row = [];
      for (let j = 0; j < 6; j++) {
        row.push(Math.floor(Math.random() * 5)); // 0-4 different piece types
      }
      board.push(row);
    }
    return board;
  }

  const handleCellClick = (row, col) => {
    if (gameOver) return;

    if (!selectedPiece) {
      setSelectedPiece({ row, col });
    } else {
      // Try to match pieces
      const piece1 = board[selectedPiece.row][selectedPiece.col];
      const piece2 = board[row][col];

      if (piece1 === piece2) {
        // Match found - calculate score
        const score = calculateScore(row, col, selectedPiece.row, selectedPiece.col);
        
        if (currentPlayer === 1) {
          setPlayer1Score(player1Score + score);
        } else {
          setPlayer2Score(player2Score + score);
        }

        // Remove matched pieces
        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = -1; // Mark as removed
        newBoard[selectedPiece.row][selectedPiece.col] = -1;
        setBoard(newBoard);

        // Next turn
        switchTurn();
      }

      setSelectedPiece(null);
    }
  };

  const calculateScore = (r1, c1, r2, c2) => {
    // Simple scoring: distance between pieces
    const distance = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    return Math.max(10, 50 - distance * 5);
  };

  const switchTurn = () => {
    if (currentPlayer === 1) {
      setCurrentPlayer(2);
    } else {
      setCurrentPlayer(1);
      setTurnsLeft(turnsLeft - 1);

      if (turnsLeft <= 1) {
        endGame();
      }
    }
  };

  const endGame = () => {
    setGameOver(true);
    if (player1Score > player2Score) {
      setWinner('Player 1');
    } else if (player2Score > player1Score) {
      setWinner('Player 2');
    } else {
      setWinner('Draw');
    }
  };

  const returnToLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="match-masters-container">
      <h1>Match Masters - Puzzle Duel</h1>

      <div className="game-info">
        <div className="player-info player1">
          <h3>Player 1</h3>
          <div className="score">{player1Score}</div>
          {currentPlayer === 1 && <div className="current-turn">Votre tour</div>}
        </div>

        <div className="game-status">
          <div className="turns-left">Tours restants: {turnsLeft}</div>
        </div>

        <div className="player-info player2">
          <h3>Player 2</h3>
          <div className="score">{player2Score}</div>
          {currentPlayer === 2 && <div className="current-turn">Votre tour</div>}
        </div>
      </div>

      {!gameOver ? (
        <div className="game-board">
          {board.map((row, rowIdx) => (
            <div key={rowIdx} className="board-row">
              {row.map((piece, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`board-cell ${piece === -1 ? 'removed' : ''} ${
                    selectedPiece?.row === rowIdx && selectedPiece?.col === colIdx ? 'selected' : ''
                  }`}
                  onClick={() => handleCellClick(rowIdx, colIdx)}
                >
                  {piece !== -1 && <span className={`piece piece-${piece}`}>{piece}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="game-result">
          <h2>🏆 Partie Terminée!</h2>
          <div className="final-scores">
            <div>Player 1: {player1Score}</div>
            <div>Player 2: {player2Score}</div>
          </div>
          <h3>{winner === 'Draw' ? 'Égalité!' : `${winner} gagne!`}</h3>
          <button onClick={returnToLobby} className="btn-back-lobby">
            Retour au Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchMastersGame;
