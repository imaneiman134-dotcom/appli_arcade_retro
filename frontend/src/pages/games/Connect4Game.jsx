import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';

const Connect4Game = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(7).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameMode, setGameMode] = useState(matchId ? 'multiplayer' : 'local'); // local or multiplayer
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(matchId ? true : false);
  
  const userId = localStorage.getItem('userId');
  const userPseudo = localStorage.getItem('userPseudo');

  useEffect(() => {
    if (matchId) {
      fetchMatchData();
    }
  }, [matchId]);

  const fetchMatchData = async () => {
    try {
      const res = await matchService.getMatch(matchId);
      setMatchData(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement du match:', err);
      setLoading(false);
    }
  };

  const checkWinner = (row, col, player) => {
    // Check horizontal
    let count = 0;
    for (let c = 0; c < 7; c++) {
      count = board[row][c] === player ? count + 1 : 0;
      if (count >= 4) return true;
    }
    // Check vertical
    count = 0;
    for (let r = 0; r < 6; r++) {
      count = board[r][col] === player ? count + 1 : 0;
      if (count >= 4) return true;
    }
    // Check diagonal (top-left to bottom-right)
    count = 0;
    for (let i = -5; i <= 5; i++) {
      const r = row + i;
      const c = col + i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7) {
        count = board[r][c] === player ? count + 1 : 0;
        if (count >= 4) return true;
      }
    }
    // Check diagonal (top-right to bottom-left)
    count = 0;
    for (let i = -5; i <= 5; i++) {
      const r = row + i;
      const c = col - i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7) {
        count = board[r][c] === player ? count + 1 : 0;
        if (count >= 4) return true;
      }
    }
    return false;
  };

  const handleColumnClick = (col) => {
    if (gameOver) return;

    // Find the lowest empty row in this column
    let row = -1;
    for (let r = 5; r >= 0; r--) {
      if (!board[r][col]) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column full

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    if (checkWinner(row, col, currentPlayer)) {
      setGameOver(true);
      setWinner(currentPlayer);
      
      // Save score for single player
      if (userId && jeuId && gameMode === 'local') {
        scoreService.saveScore(userId, jeuId, 100);
      }
      
      // Update match if multiplayer
      if (matchId && matchData) {
        const winnerId = currentPlayer === 'red' ? matchData.player1?.id : matchData.player2?.id;
        matchService.setMatchWinner(matchId, winnerId);
      }
    } else {
      setCurrentPlayer(currentPlayer === 'red' ? 'yellow' : 'red');
    }
  };

  if (loading) return <div className="loading">Chargement du match...</div>;

  const player1Name = matchData?.player1?.pseudo || 'Joueur 1';
  const player2Name = matchData?.player2?.pseudo || 'Joueur 2';

  return (
    <div className="connect4-container">
      <h1>🔴 Puissance 4</h1>
      
      {gameMode === 'multiplayer' && matchData && (
        <div className="multiplayer-info">
          <div className={`player-info ${currentPlayer === 'red' ? 'active' : ''}`}>
            <span className="player-name">{player1Name}</span>
            <span className="player-color" style={{backgroundColor: 'red'}}></span>
          </div>
          <span className="vs">VS</span>
          <div className={`player-info ${currentPlayer === 'yellow' ? 'active' : ''}`}>
            <span className="player-name">{player2Name}</span>
            <span className="player-color" style={{backgroundColor: 'gold'}}></span>
          </div>
        </div>
      )}

      <div className="connect4-info">
        <p>Tour du joueur : <span style={{color: currentPlayer === 'red' ? 'red' : 'gold', fontWeight: 'bold'}}>{currentPlayer === 'red' ? 'Rouge' : 'Jaune'}</span></p>
      </div>
      
      <div className="connect4-board">
        {Array(7).fill(null).map((_, col) => (
          <div key={col} className="connect4-column" onClick={() => handleColumnClick(col)}>
            {Array(6).fill(null).map((_, row) => (
              <div key={row} className={`connect4-cell ${board[row][col] || 'empty'}`}>
                {board[row][col] && <div className={`pion ${board[row][col]}`} />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-overlay">
          <h2>🏆 Victoire du joueur {winner === 'red' ? 'Rouge' : 'Jaune'} !</h2>
          <p>{winner === 'red' ? player1Name : player2Name} a remporté la partie !</p>
          <button onClick={() => navigate('/lobby')} className="btn-secondary">Retour au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default Connect4Game;
