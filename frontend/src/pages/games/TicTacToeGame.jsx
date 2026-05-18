import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreService } from '../../services/api';

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(board) {
  for (const [a,b,c] of WIN_LINES)
    if (board[a] && board[a] === board[b] && board[a] === board[c])
      return board[a];
  return board.every(Boolean) ? 'draw' : null;
}

export default function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState('');
  const [score, setScore] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('X'); // X for player 1, O for player 2
  const [isLocalGame, setIsLocalGame] = useState(true); // For now, local 2-player
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const saveScore = async (pts) => {
    if (!userId || !jeuId) return;
    try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), pts); } catch(e) {}
  };

  const handleClick = (i) => {
    if (board[i] || gameOver) return;
    
    const nb = [...board];
    nb[i] = currentPlayer;
    const w = checkWinner(nb);
    
    setBoard(nb);
    
    if (w) {
      endGame(w, nb);
    } else {
      // Switch player
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  };

  const endGame = (w, b) => {
    setGameOver(true);
    if (w === 'X') { 
      setResult('Joueur 1 gagne ! +10 pts'); 
      setScore(10); 
      saveScore(10); 
    }
    else if (w === 'O') { 
      setResult('Joueur 2 gagne ! +10 pts'); 
      setScore(10); 
      saveScore(10); 
    }
    else { 
      setResult('Match nul ! +5 pts'); 
      setScore(5); 
      saveScore(5); 
    }
  };

  const restart = () => {
    setBoard(Array(9).fill(null));
    setGameOver(false); 
    setResult(''); 
    setScore(0);
    setCurrentPlayer('X');
  };

  const returnToLobby = () => {
    navigate('/lobby');
  };

  const winner = checkWinner(board);

  return (
    <div className="game-page">
      <h2>Tic Tac Toe - 1v1</h2>
      <div className="game-info">
        <p className="game-hint">
          Joueur 1: <strong style={{color:'#00ff00'}}>X</strong> | 
          Joueur 2: <strong style={{color:'#ff0000'}}>O</strong>
        </p>
        <p className="current-player">
          Tour de: <strong>{currentPlayer === 'X' ? 'Joueur 1 (X)' : 'Joueur 2 (O)'}</strong>
        </p>
      </div>
      
      <div className="ttt-grid">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell === 'X' ? 'ttt-x' : cell === 'O' ? 'ttt-o' : ''}`}
            onClick={() => handleClick(i)}
            disabled={gameOver}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="game-overlay">
          <h3>{result}</h3>
          <div className="overlay-buttons">
            <button onClick={restart} className="btn-secondary">Nouvelle partie</button>
            <button onClick={returnToLobby} className="btn-secondary">Retour au Lobby</button>
          </div>
        </div>
      )}
    </div>
  );
}
