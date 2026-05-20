import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
// IMPORT DU NOUVEAU HOOK
import { useMultiplayerSync } from '../../hooks/useMultiplayerSync';

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
  const [currentPlayer, setCurrentPlayer] = useState('X'); // X commence toujours
  
  const [playerRole, setPlayerRole] = useState(null); // 'X' (Joueur 1) ou 'O' (Joueur 2)

  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken'); // Sécurité WebSocket

  const saveScore = async (pts) => {
    if (!userId || !jeuId) return;
    try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), pts); } catch(e) {}
  };

  // --- NOUVEAU SYSTÈME DE SYNCHRONISATION MULTIJOUEUR ---
  const handleMessageReceived = (message) => {
    if (message.actionType === 'MOVE') {
      const { position, role } = message.payload;
      handleIncomingMove(position, role);
    }
  };

  // Initialisation du Hook multijoueur
  const { isConnected, sendSyncEvent } = useMultiplayerSync(
    matchId,
    userId,
    authToken,
    handleMessageReceived
  );
  // ------------------------------------------------------

  useEffect(() => {
    if (!userId || !matchId) return;

    // 1. Déterminer le rôle du joueur (X ou O) via l'API Match avec notre service
    const fetchMatchData = async () => {
        try {
            const res = await matchService.getMatch(matchId);
            const match = res.data;
            if (match.player1?.id.toString() === userId) {
                setPlayerRole('X');
            } else if (match.player2?.id.toString() === userId) {
                setPlayerRole('O');
            }
        } catch (err) {
            console.error("Erreur chargement rôles:", err);
        }
    };

    fetchMatchData();
    // Le hook gère la connexion WebSocket tout seul !
  }, [userId, matchId]);

  // Fonction pour traiter un mouvement (le nôtre ou celui de l'adversaire)
  const handleIncomingMove = (position, role) => {
    setBoard(prev => {
      const newBoard = [...prev];
      if (newBoard[position]) return prev; // Sécurité

      newBoard[position] = role;
      
      const w = checkWinner(newBoard);
      if (w) {
        // setTimeout pour s'assurer que l'état a bien le dernier rôle affiché
        setTimeout(() => endGame(w), 50); 
      } else {
        setCurrentPlayer(role === 'X' ? 'O' : 'X'); // Au tour de l'autre
      }
      
      return newBoard;
    });
  };

  // Fonction pour gérer la fin du jeu
  const endGame = (w) => {
    setGameOver(true);
    setPlayerRole(currentRole => {
        if (w === currentRole) { 
            setResult('🎉 Victoire ! +10 pts'); 
            saveScore(10); 
            // On déclare le gagnant au backend
            if (matchId) matchService.setMatchWinner(matchId, userId).catch(e => console.error(e));
        } else if (w === 'draw') { 
            setResult('🤝 Match nul ! +5 pts'); 
            saveScore(5); 
        } else { 
            setResult('💀 Défaite...'); 
        }
        return currentRole;
    });
  };

  // Fonction quand JE clique sur une case
  const handleClick = (i) => {
    // BLOCAGE : Si la case est prise, le jeu est fini, ou CE N'EST PAS MON TOUR !
    if (board[i] || gameOver || currentPlayer !== playerRole) {
      return; 
    }
    
    if (isConnected) {
      // 1. Jouer le coup localement pour un affichage immédiat
      handleIncomingMove(i, playerRole);

      // 2. Envoyer le coup à l'adversaire
      sendSyncEvent('MOVE', {
        position: i,
        role: playerRole
      });
    } else {
      console.warn("Attente de connexion réseau...");
    }
  };

  const returnToLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="game-page">
      <h2>Tic Tac Toe - Multijoueur</h2>
      <div className="game-info">
        <p className="game-hint">
          Vous êtes : <strong style={{color: playerRole === 'X' ? '#00ff00' : '#ff0000'}}>
            {playerRole ? playerRole : 'Chargement...'}
          </strong>
        </p>
        <p className="current-player" style={{
            padding: '10px', 
            backgroundColor: currentPlayer === playerRole ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
            borderRadius: '5px'
        }}>
          {currentPlayer === playerRole ? "🟢 C'est à VOTRE tour de jouer !" : "🔴 En attente de l'adversaire..."}
        </p>
      </div>
      
      <div className="ttt-grid">
        {board.map((cell, i) => (
          <button
            key={i}
            className={`ttt-cell ${cell === 'X' ? 'ttt-x' : cell === 'O' ? 'ttt-o' : ''}`}
            onClick={() => handleClick(i)}
            disabled={gameOver || currentPlayer !== playerRole}
          >
            {cell}
          </button>
        ))}
      </div>

      {gameOver && (
        <div className="game-overlay">
          <h3>{result}</h3>
          <div className="overlay-buttons">
            <button onClick={returnToLobby} className="btn-secondary">Retour au Lobby</button>
          </div>
        </div>
      )}
    </div>
  );
}