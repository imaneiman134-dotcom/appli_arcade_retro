import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
  const [currentPlayer, setCurrentPlayer] = useState('X'); 
  
  const [playerRole, setPlayerRole] = useState(null); 
  const [stompClient, setStompClient] = useState(null);

  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  const saveScore = async (pts) => {
    if (!userId || !jeuId) return;
    try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), pts); } catch(e) {}
  };

  useEffect(() => {
    if (!userId || !matchId) return;

    matchService.getMatch(matchId)
      .then(res => {
        const match = res.data;
        if (match.player1?.id.toString() === userId) {
          setPlayerRole('X');
        } else if (match.player2?.id.toString() === userId) {
          setPlayerRole('O');
        }
      })
      .catch(err => console.error("Erreur chargement rôles:", err));

    const currentHost = window.location.hostname;
    const socketUrl = `http://${currentHost}:8080/ws-arcade`;
    const socket = new SockJS(socketUrl);
    
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log(`🔌 Connecté au plateau du match ${matchId}`);
        
        client.subscribe(`/topic/game/${matchId}`, (message) => {
          const move = JSON.parse(message.body);
          handleIncomingMove(move.position, move.role);
        });
      }
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate(); 
  }, [userId, matchId]);

  const handleIncomingMove = (position, role) => {
    setBoard(prev => {
      const newBoard = [...prev];
      if (newBoard[position]) return prev;

      newBoard[position] = role;
      
      const w = checkWinner(newBoard);
      if (w) {
        setTimeout(() => endGame(w), 50); 
      } else {
        setCurrentPlayer(role === 'X' ? 'O' : 'X');
      }
      
      return newBoard;
    });
  };

  const endGame = (w) => {
    setGameOver(true);
    setPlayerRole(currentRole => {
        if (w === currentRole) { 
            setResult('Victoire ! +10 pts'); 
            saveScore(10); 
        } else if (w === 'draw') { 
            setResult('Match nul ! +5 pts'); 
            saveScore(5); 
        } else { 
            setResult('Défaite...'); 
        }
        return currentRole;
    });
  };

  const handleClick = (i) => {
    if (board[i] || gameOver || currentPlayer !== playerRole) {
      return; 
    }
    
    if (stompClient && stompClient.connected) {
      const move = {
        matchId: parseInt(matchId),
        playerId: parseInt(userId),
        position: i,
        role: playerRole
      };
      
      stompClient.publish({
        destination: '/app/game.move',
        body: JSON.stringify(move)
      });
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
          {currentPlayer === playerRole ? "C'est à VOTRE tour de jouer !" : "En attente de l'adversaire..."}
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