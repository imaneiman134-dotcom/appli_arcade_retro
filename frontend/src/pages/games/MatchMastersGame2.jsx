import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './match-masters.css';

const width = 8;
const blockColors = [
  '#ef4444', // Rouge
  '#3b82f6', // Bleu
  '#10b981', // Vert
  '#f59e0b', // Jaune
  '#8b5cf6', // Violet
  '#ec4899'  // Rose
];

const MatchMastersGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();

  const [currentBoard, setCurrentBoard] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  
  // --- NOUVEAUX ÉTATS MULTIJOUEURS ---
  const [myHealth, setMyHealth] = useState(200);
  const [opponentHealth, setOpponentHealth] = useState(200);
  const [gameOver, setGameOver] = useState(false);
  const [matchResult, setMatchResult] = useState(''); // 'victory' ou 'defeat'
  const [matchData, setMatchData] = useState(null);
  
  const userId = localStorage.getItem('userId');
  
  // Références pour accéder aux valeurs à jour dans les setInterval et callbacks
  const stompClientRef = useRef(null);
  const gameOverRef = useRef(false);
  const myHealthRef = useRef(200);

  // 1. INITIALISATION DU JEU ET CONNEXION
  useEffect(() => {
    if (!matchId || !userId) return;

    const initGame = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        setMatchData(res.data);

        const currentHost = window.location.hostname;
        const socket = new SockJS(`http://${currentHost}:8080/ws-arcade`);
        const client = new Client({
          webSocketFactory: () => socket,
          onConnect: () => {
            console.log(`🔌 Connecté à Match Masters (Match ${matchId})`);
            
            client.subscribe(`/topic/game/${matchId}`, (message) => {
              const move = JSON.parse(message.body);
              
              // Si le message vient de l'adversaire
              if (move.playerId.toString() !== userId) {
                if (move.role === 'DAMAGE') {
                  handleIncomingDamage(move.position); // On utilise 'position' pour transmettre le montant des dégâts
                } else if (move.role === 'DEAD') {
                  endGame('victory'); // L'adversaire annonce qu'il est mort
                }
              }
            });
          }
        });

        client.activate();
        stompClientRef.current = client;

      } catch (err) {
        console.error("Erreur de connexion :", err);
      }
    };

    initGame();
    createBoard();

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [matchId, userId]);

  const createBoard = () => {
    const randomBoard = [];
    for (let i = 0; i < width * width; i++) {
      randomBoard.push(blockColors[Math.floor(Math.random() * blockColors.length)]);
    }
    setCurrentBoard(randomBoard);
  };

  // --- LOGIQUE DE COMBAT ---

  // Je reçois des dégâts de l'adversaire
  const handleIncomingDamage = (damageAmount) => {
    if (gameOverRef.current) return;
    
    setMyHealth(prev => {
      const newHealth = Math.max(0, prev - damageAmount);
      myHealthRef.current = newHealth;
      
      if (newHealth <= 0) {
        endGame('defeat');
        // Je préviens l'adversaire que je suis K.O.
        if (stompClientRef.current) {
          stompClientRef.current.publish({
            destination: '/app/game.move',
            body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: 'DEAD' })
          });
        }
      }
      return newHealth;
    });
  };

  // J'envoie des dégâts à l'adversaire
  const dealDamage = useCallback((damageAmount) => {
    if (gameOverRef.current) return;

    // Mise à jour visuelle locale
    setOpponentHealth(prev => Math.max(0, prev - damageAmount));

    // Envoi réseau
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: '/app/game.move',
        body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: damageAmount, role: 'DAMAGE' })
      });
    }
  }, [matchId, userId]);

  const endGame = async (result) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    setMatchResult(result);

    if (result === 'victory') {
      try {
        await scoreService.saveScore(parseInt(userId), parseInt(jeuId), 100); // 100 pts victoire
        await matchService.setMatchWinner(matchId, userId);
      } catch(e) { console.error(e); }
    }
  };

  // --- MOTEUR DE MATCH-3 (Adapté avec dealDamage) ---

  const checkForColumnOfFour = useCallback(() => {
    for (let i = 0; i <= 39; i++) {
      const columnOfFour = [i, i + width, i + width * 2, i + width * 3];
      const decidedColor = currentBoard[i];
      const isBlank = currentBoard[i] === '';

      if (columnOfFour.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        dealDamage(40); // 40 points de dégâts !
        columnOfFour.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  }, [currentBoard, dealDamage]);

  const checkForRowOfFour = useCallback(() => {
    for (let i = 0; i < 64; i++) {
      const rowOfFour = [i, i + 1, i + 2, i + 3];
      const decidedColor = currentBoard[i];
      const notValid = [5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63];
      const isBlank = currentBoard[i] === '';

      if (notValid.includes(i)) continue;

      if (rowOfFour.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        dealDamage(40);
        rowOfFour.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  }, [currentBoard, dealDamage]);

  const checkForColumnOfThree = useCallback(() => {
    for (let i = 0; i <= 47; i++) {
      const columnOfThree = [i, i + width, i + width * 2];
      const decidedColor = currentBoard[i];
      const isBlank = currentBoard[i] === '';

      if (columnOfThree.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        dealDamage(30); // 30 points de dégâts !
        columnOfThree.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  }, [currentBoard, dealDamage]);

  const checkForRowOfThree = useCallback(() => {
    for (let i = 0; i < 64; i++) {
      const rowOfThree = [i, i + 1, i + 2];
      const decidedColor = currentBoard[i];
      const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
      const isBlank = currentBoard[i] === '';

      if (notValid.includes(i)) continue;

      if (rowOfThree.every(square => currentBoard[square] === decidedColor && !isBlank)) {
        dealDamage(30);
        rowOfThree.forEach(square => currentBoard[square] = '');
        return true;
      }
    }
  }, [currentBoard, dealDamage]);

  const moveIntoSquareBelow = useCallback(() => {
    for (let i = 0; i <= 55; i++) {
      const firstRow = [0, 1, 2, 3, 4, 5, 6, 7];
      const isFirstRow = firstRow.includes(i);

      if (isFirstRow && currentBoard[i] === '') {
        currentBoard[i] = blockColors[Math.floor(Math.random() * blockColors.length)];
      }

      if ((currentBoard[i + width]) === '') {
        currentBoard[i + width] = currentBoard[i];
        currentBoard[i] = '';
      }
    }
  }, [currentBoard]);

  // Boucle de jeu
  useEffect(() => {
    const timer = setInterval(() => {
      if (gameOverRef.current) return;
      checkForColumnOfFour();
      checkForRowOfFour();
      checkForColumnOfThree();
      checkForRowOfThree();
      moveIntoSquareBelow();
      setCurrentBoard([...currentBoard]);
    }, 100);
    return () => clearInterval(timer);
  }, [checkForColumnOfFour, checkForRowOfFour, checkForColumnOfThree, checkForRowOfThree, moveIntoSquareBelow, currentBoard]);

  // --- ACTIONS JOUEUR ---

  const handleSquareClick = (index) => {
    if (gameOverRef.current) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      const isAdjacent =
        index === selectedIndex - 1 ||
        index === selectedIndex + 1 ||
        index === selectedIndex - width ||
        index === selectedIndex + width;

      if (isAdjacent) {
        const newBoard = [...currentBoard];
        const colorOne = newBoard[selectedIndex];
        const colorTwo = newBoard[index];
        newBoard[selectedIndex] = colorTwo;
        newBoard[index] = colorOne;
        setCurrentBoard(newBoard);
      }
      setSelectedIndex(null);
    }
  };

  const opponentName = matchData?.player1?.id.toString() === userId 
    ? matchData?.player2?.pseudo 
    : matchData?.player1?.pseudo;

  return (
    <div className="match-masters-wrapper">
      <div className="match-header">
        <h1>Match Masters - DUEL</h1>
        
        {/* BARRES DE VIE */}
        <div className="health-arena" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', width: '100%', maxWidth: '500px', marginTop: '15px' }}>
          
          <div className="health-card" style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ fontWeight: 'bold' }}>Moi (HP)</span>
            <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden', marginTop: '5px' }}>
              <div style={{ width: `${(myHealth / 200) * 100}%`, height: '100%', backgroundColor: '#2ecc71', transition: 'width 0.3s ease' }}></div>
            </div>
            <span>{myHealth} / 200</span>
          </div>

          <div className="health-card" style={{ flex: 1, textAlign: 'right' }}>
            <span style={{ fontWeight: 'bold' }}>{opponentName || 'Adversaire'} (HP)</span>
            <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden', marginTop: '5px', direction: 'rtl' }}>
              <div style={{ width: `${(opponentHealth / 200) * 100}%`, height: '100%', backgroundColor: '#e74c3c', transition: 'width 0.3s ease' }}></div>
            </div>
            <span>{opponentHealth} / 200</span>
          </div>

        </div>
      </div>

      <div className="block-board">
        {currentBoard.map((color, index) => (
          <div
            key={index}
            className={`block-cell ${selectedIndex === index ? 'selected' : ''}`}
            onClick={() => handleSquareClick(index)}
          >
            {color && <div className="color-block" style={{ backgroundColor: color, width: '100%', height: '100%', borderRadius: '8px', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.3)' }}></div>}
          </div>
        ))}
      </div>

      {gameOver && (
        <div className="game-over-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <h2 style={{ fontSize: '40px', color: matchResult === 'victory' ? '#2ecc71' : '#e74c3c' }}>
            {matchResult === 'victory' ? '🏆 VICTOIRE !' : '💀 K.O.'}
          </h2>
          <p style={{fontSize: "20px", marginBottom: '30px'}}>
            {matchResult === 'victory' ? "Tu as écrasé ton adversaire !" : "Ton adversaire a été plus rapide..."}
          </p>
          <button onClick={() => navigate('/lobby')} className="btn-arcade" style={{ padding: '15px 30px', fontSize: '18px' }}>Retour au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default MatchMastersGame;