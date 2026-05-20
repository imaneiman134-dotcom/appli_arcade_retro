import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import { useMultiplayerSync } from '../../hooks/useMultiplayerSync'; 
import './connect4.css';

const Connect4Game = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(Array(6).fill(null).map(() => Array(7).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [playerRole, setPlayerRole] = useState(null); 

  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken'); // Ajout pour le websocket sécurisé
  
  const lastMoveTime = useRef(0);

  // --- NOUVEAU SYSTÈME DE SYNCHRONISATION MULTIJOUEUR ---
  const handleMessageReceived = (message) => {
    // On vérifie qu'il s'agit bien d'une action de type MOVE
    if (message.actionType === 'MOVE') {
      const { position, role } = message.payload;
      handleIncomingMove(position, role);
    }
  };

  // Initialisation du Hook de votre camarade
  const { isConnected, sendSyncEvent } = useMultiplayerSync(
    matchId,
    userId,
    authToken,
    handleMessageReceived
  );
  // ------------------------------------------------------

  useEffect(() => {
    if (!matchId || !userId) return;

    const fetchMatchData = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        const match = res.data;
        setMatchData(match);
        
        if (match.player1?.id.toString() === userId) {
          setPlayerRole('red');
        } else if (match.player2?.id.toString() === userId) {
          setPlayerRole('yellow');
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur initialisation match:', err);
        setLoading(false);
      }
    };

    fetchMatchData();
    // Le hook useMultiplayerSync s'occupe déjà d'ouvrir et de fermer la connexion
  }, [matchId, userId]);

  const checkWinner = (currentBoard, row, col, player) => {
    let count = 0;
    for (let c = 0; c < 7; c++) {
      count = currentBoard[row][c] === player ? count + 1 : 0;
      if (count >= 4) return true;
    }
    count = 0;
    for (let r = 0; r < 6; r++) {
      count = currentBoard[r][col] === player ? count + 1 : 0;
      if (count >= 4) return true;
    }
    count = 0;
    for (let i = -5; i <= 5; i++) {
      const r = row + i;
      const c = col + i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7) {
        count = currentBoard[r][c] === player ? count + 1 : 0;
        if (count >= 4) return true;
      }
    }
    count = 0;
    for (let i = -5; i <= 5; i++) {
      const r = row + i;
      const c = col - i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7) {
        count = currentBoard[r][c] === player ? count + 1 : 0;
        if (count >= 4) return true;
      }
    }
    return false;
  };

  const handleIncomingMove = (col, role) => {
    const now = Date.now();
    if (now - lastMoveTime.current < 300) return;
    lastMoveTime.current = now;

    setBoard(prevBoard => {
      const newBoard = prevBoard.map(r => [...r]);
      
      let row = -1;
      for (let r = 5; r >= 0; r--) {
        if (!newBoard[r][col]) {
          row = r;
          break;
        }
      }

      if (row !== -1) {
        newBoard[row][col] = role;
        
        if (checkWinner(newBoard, row, col, role)) {
          setTimeout(() => endGame(role), 50);
        } else {
          setCurrentPlayer(role === 'red' ? 'yellow' : 'red');
        }
      }
      return newBoard;
    });
  };

  const endGame = async (winningRole) => {
    setGameOver(true);
    setWinner(winningRole);
    
    if (winningRole === playerRole) {
      if (userId && jeuId) {
        try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), 15); } catch(e) {}
      }
      
      if (matchId && matchData) {
        const winnerId = winningRole === 'red' ? matchData.player1?.id : matchData.player2?.id;
        try { await matchService.setMatchWinner(matchId, winnerId); } catch(e) {}
      }
    }
  };

  const handleColumnClick = (col) => {
    if (gameOver || currentPlayer !== playerRole) return;
    if (board[0][col]) return; 

    if (isConnected) {
      // 1. Jouer le coup localement pour voir le pion tomber tout de suite
      handleIncomingMove(col, playerRole);

      // 2. Envoyer l'action à l'adversaire
      sendSyncEvent('MOVE', {
        position: col, 
        role: playerRole
      });
    } else {
      console.warn("En attente de connexion réseau...");
    }
  };

  if (loading) return <div className="loading">Chargement du match...</div>;

  const player1Name = matchData?.player1?.pseudo || 'Joueur 1';
  const player2Name = matchData?.player2?.pseudo || 'Joueur 2';

  return (
    <div className="connect4-container">
      <h1>Puissance 4 Multijoueur</h1>
      
      <div className="game-info" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p>
          Vous êtes : <strong style={{ color: playerRole === 'red' ? '#e74c3c' : '#f1c40f' }}>
            {playerRole === 'red' ? player1Name + ' (Rouge)' : player2Name + ' (Jaune)'}
          </strong>
        </p>
        <p style={{
            display: 'inline-block',
            padding: '10px 20px', 
            backgroundColor: currentPlayer === playerRole ? 'rgba(0,255,0,0.2)' : 'rgba(255,0,0,0.2)',
            borderRadius: '5px',
            fontWeight: 'bold'
        }}>
          {currentPlayer === playerRole ? "🟢 C'est à VOTRE tour !" : "🔴 En attente de l'adversaire..."}
        </p>
      </div>

      <div className="multiplayer-info" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
        <div className={`player-info ${currentPlayer === 'red' ? 'active' : ''}`} style={{ opacity: currentPlayer === 'red' ? 1 : 0.5 }}>
          <span className="player-name">{player1Name}</span>
          <span className="player-color" style={{backgroundColor: '#e74c3c', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-block', marginLeft: '10px'}}></span>
        </div>
        <span className="vs">VS</span>
        <div className={`player-info ${currentPlayer === 'yellow' ? 'active' : ''}`} style={{ opacity: currentPlayer === 'yellow' ? 1 : 0.5 }}>
          <span className="player-name">{player2Name}</span>
          <span className="player-color" style={{backgroundColor: '#f1c40f', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-block', marginLeft: '10px'}}></span>
        </div>
      </div>

      <div className="connect4-board">
        {Array(7).fill(null).map((_, col) => (
          <div key={col} className="connect4-column" onClick={() => handleColumnClick(col)}>
            {Array(6).fill(null).map((_, row) => (
              <div key={row} className="connect4-cell">
                {board[row][col] && <div className={`pion ${board[row][col]}`} />}
              </div>
            ))}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-overlay" style={{ marginTop: '30px', textAlign: 'center' }}>
          <h2>Victoire du joueur {winner === 'red' ? 'Rouge' : 'Jaune'} !</h2>
          <p>{winner === 'red' ? player1Name : player2Name} a remporté la partie.</p>
          <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}>Retour au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default Connect4Game;