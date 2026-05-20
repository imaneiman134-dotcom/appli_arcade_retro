import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './match-masters.css';

const width = 8;
const blockColors = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'
];

// Dictionnaire pour compresser les couleurs afin de les envoyer vite sur le réseau
const COLOR_MAP = { '#ef4444': 'R', '#3b82f6': 'B', '#10b981': 'G', '#f59e0b': 'Y', '#8b5cf6': 'V', '#ec4899': 'P', '': 'E' };
const REVERSE_MAP = { 'R': '#ef4444', 'B': '#3b82f6', 'G': '#10b981', 'Y': '#f59e0b', 'V': '#8b5cf6', 'P': '#ec4899', 'E': '' };

const MatchMastersGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();

  // ÉTATS REACT (Pour l'affichage)
  const [currentBoard, setCurrentBoard] = useState(Array(64).fill(''));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [p1Health, setP1Health] = useState(200);
  const [p2Health, setP2Health] = useState(200);
  const [currentTurn, setCurrentTurn] = useState('player2'); // Le P1 recevra le tour à la fin de la génération du plateau
  const [gameOver, setGameOver] = useState(false);
  const [matchResult, setMatchResult] = useState(''); 
  const [matchData, setMatchData] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  const userId = localStorage.getItem('userId');

  // RÉFÉRENCES (Pour le moteur de jeu en temps réel sans bloquer React)
  const boardRef = useRef(Array(64).fill(''));
  const p1HealthRef = useRef(200);
  const p2HealthRef = useRef(200);
  const currentTurnRef = useRef('player2');
  const isResolvingRef = useRef(true); 
  const gameOverRef = useRef(false);
  const isHostRef = useRef(false);
  const myRoleRef = useRef(null);
  const stompClientRef = useRef(null);

  // Fonction pour mettre fin au jeu
  const endGame = useCallback(async (winnerRole) => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    
    const isMyVictory = (winnerRole === myRoleRef.current);
    setMatchResult(isMyVictory ? 'victory' : 'defeat');

    if (isMyVictory) {
      try {
        await scoreService.saveScore(parseInt(userId), parseInt(jeuId), 100); 
        await matchService.setMatchWinner(matchId, userId);
      } catch(e) { console.error(e); }
    }
  }, [jeuId, matchId, userId]);

  // Fonction pour envoyer le plateau (Réservée au Host)
  const sendSync = useCallback(() => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;
    const boardStr = boardRef.current.map(c => COLOR_MAP[c]).join('');
    const payload = `SYNC:${p1HealthRef.current}:${p2HealthRef.current}:${currentTurnRef.current}:${boardStr}`;
    
    stompClientRef.current.publish({
      destination: '/app/game.move',
      body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: payload })
    });
  }, [matchId, userId]);

  // 1. INITIALISATION ET CONNEXION
  useEffect(() => {
    if (!matchId || !userId) return;

    const initGame = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        setMatchData(res.data);

        // Définir qui est le Serveur Maître (Host)
        const host = res.data.player1.id.toString() === userId;
        isHostRef.current = host;
        const role = host ? 'player1' : 'player2';
        myRoleRef.current = role;
        setMyRole(role);

        // Si je suis l'hôte, je génère le plateau initial
        if (host) {
          const randomBoard = [];
          for (let i = 0; i < width * width; i++) {
            randomBoard.push(blockColors[Math.floor(Math.random() * blockColors.length)]);
          }
          boardRef.current = randomBoard;
          setCurrentBoard([...randomBoard]);
          setIsEngineRunning(true);
        }

        const currentHost = window.location.hostname;
        const socket = new SockJS(`http://${currentHost}:8080/ws-arcade`);
        const client = new Client({
          webSocketFactory: () => socket,
          onConnect: () => {
            console.log(`🔌 Connecté à Match Masters (Match ${matchId})`);
            
            client.subscribe(`/topic/game/${matchId}`, (message) => {
              const move = JSON.parse(message.body);
              const payload = move.role;
              const senderId = move.playerId;

              if (senderId.toString() === userId) return; // On ignore ses propres messages
              
              if (isHostRef.current) {
                  // Le Host reçoit une demande du Guest
                  if (payload === 'HELLO') {
                      sendSync(); // Le Guest vient d'arriver, on lui donne le plateau
                  }
                  else if (payload.startsWith('SWAP:')) {
                      const parts = payload.split(':');
                      const idx1 = parseInt(parts[1]);
                      const idx2 = parseInt(parts[2]);
                      
                      // On vérifie que c'est bien au tour du Guest et que le plateau est stable
                      if (currentTurnRef.current === 'player2' && !isResolvingRef.current) {
                          const c1 = boardRef.current[idx1];
                          const c2 = boardRef.current[idx2];
                          boardRef.current[idx1] = c2;
                          boardRef.current[idx2] = c1;
                          isResolvingRef.current = true;
                          setCurrentBoard([...boardRef.current]);
                          sendSync(); // Confirmation immédiate au Guest
                      }
                  }
              } else {
                  // Le Guest reçoit la vérité absolue du Host (SYNC)
                  if (payload.startsWith('SYNC:')) {
                      const parts = payload.split(':');
                      const h1 = parseInt(parts[1]);
                      const h2 = parseInt(parts[2]);
                      const turn = parts[3];
                      const boardStr = parts[4];
                      
                      p1HealthRef.current = h1;
                      p2HealthRef.current = h2;
                      currentTurnRef.current = turn;

                      setP1Health(h1);
                      setP2Health(h2);
                      setCurrentTurn(turn);
                      // Décompression de la grille
                      setCurrentBoard(boardStr.split('').map(char => REVERSE_MAP[char]));
                      
                      if (h1 <= 0 || h2 <= 0) {
                          endGame(h1 <= 0 ? 'player2' : 'player1');
                      }
                  }
              }
            });

            // Si je suis Guest, je me présente pour réclamer le plateau
            if (!host) {
               client.publish({
                 destination: '/app/game.move',
                 body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: 'HELLO' })
               });
            }
          }
        });

        client.activate();
        stompClientRef.current = client;

      } catch (err) {
        console.error("Erreur :", err);
      }
    };

    initGame();

    return () => {
      if (stompClientRef.current) stompClientRef.current.deactivate();
    };
  }, [matchId, userId, sendSync, endGame]);

  // 2. LE MOTEUR DE JEU (S'exécute UNIQUEMENT chez le Host)
  useEffect(() => {
    if (!isEngineRunning) return;

    const timer = setInterval(() => {
        if (gameOverRef.current) return;

        let boardChanged = false;
        let damageThisFrame = 0;

        const checkMatch = (indices, dmg) => {
            let matched = false;
            const c = boardRef.current[indices[0]];
            if (c !== '' && indices.every(sq => boardRef.current[sq] === c)) {
                damageThisFrame += dmg;
                indices.forEach(sq => boardRef.current[sq] = '');
                matched = true;
            }
            return matched;
        };

        // Colonnes de 4
        for (let i = 0; i <= 39; i++) if (checkMatch([i, i + width, i + width * 2, i + width * 3], 40)) boardChanged = true;
        
        // Lignes de 4
        const invalidRow4 = [5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63];
        for (let i = 0; i < 64; i++) if (!invalidRow4.includes(i) && checkMatch([i, i + 1, i + 2, i + 3], 40)) boardChanged = true;
        
        // Colonnes de 3
        for (let i = 0; i <= 47; i++) if (checkMatch([i, i + width, i + width * 2], 30)) boardChanged = true;
        
        // Lignes de 3
        const invalidRow3 = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
        for (let i = 0; i < 64; i++) if (!invalidRow3.includes(i) && checkMatch([i, i + 1, i + 2], 30)) boardChanged = true;

        // Gravité
        let moved = false;
        for (let i = 0; i <= 55; i++) {
            const isFirstRow = i < 8;
            if (isFirstRow && boardRef.current[i] === '') {
                boardRef.current[i] = blockColors[Math.floor(Math.random() * blockColors.length)];
                moved = true;
            }
            if (boardRef.current[i + width] === '' && boardRef.current[i] !== '') {
                boardRef.current[i + width] = boardRef.current[i];
                boardRef.current[i] = '';
                moved = true;
            }
        }
        if (moved) boardChanged = true;

        let stateChanged = false;
        if (boardChanged) stateChanged = true;

        // Calcul des dégâts
        if (damageThisFrame > 0) {
            if (currentTurnRef.current === 'player1') {
                p2HealthRef.current = Math.max(0, p2HealthRef.current - damageThisFrame);
            } else {
                p1HealthRef.current = Math.max(0, p1HealthRef.current - damageThisFrame);
            }
            stateChanged = true;
            isResolvingRef.current = true; 
        }

        // Fin de l'animation : le plateau est stable !
        if (isResolvingRef.current && !boardChanged) {
            isResolvingRef.current = false;
            currentTurnRef.current = currentTurnRef.current === 'player1' ? 'player2' : 'player1';
            stateChanged = true;
        }

        // Diffuser la vérité aux joueurs
        if (stateChanged) {
            setCurrentBoard([...boardRef.current]);
            setP1Health(p1HealthRef.current);
            setP2Health(p2HealthRef.current);
            setCurrentTurn(currentTurnRef.current);
            
            sendSync(); // Envoi des 64 blocs via le réseau !

            if (p1HealthRef.current <= 0 || p2HealthRef.current <= 0) {
                endGame(p1HealthRef.current <= 0 ? 'player2' : 'player1');
            }
        }
    }, 100);

    return () => clearInterval(timer);
  }, [isEngineRunning, sendSync, endGame]);

  // 3. ACTIONS DU JOUEUR (Clics)
  const handleSquareClick = (index) => {
    if (gameOver) return;
    if (currentTurn !== myRole) return; 
    
    // On bloque les clics si les blocs sont en train de tomber
    if (isHostRef.current && isResolvingRef.current) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      const isAdjacent =
        index === selectedIndex - 1 ||
        index === selectedIndex + 1 ||
        index === selectedIndex - width ||
        index === selectedIndex + width;

      if (isAdjacent) {
        if (isHostRef.current) {
            // L'hôte applique directement son propre coup
            const c1 = boardRef.current[selectedIndex];
            const c2 = boardRef.current[index];
            boardRef.current[selectedIndex] = c2;
            boardRef.current[index] = c1;
            isResolvingRef.current = true;
            setCurrentBoard([...boardRef.current]);
        } else {
            // Le Guest donne un aperçu local pour plus de fluidité...
            const newBoard = [...currentBoard];
            const c1 = newBoard[selectedIndex];
            const c2 = newBoard[index];
            newBoard[selectedIndex] = c2;
            newBoard[index] = c1;
            setCurrentBoard(newBoard);
            
            // ...et demande la validation au Host !
            if (stompClientRef.current) {
                stompClientRef.current.publish({
                  destination: '/app/game.move',
                  body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: `SWAP:${selectedIndex}:${index}` })
                });
            }
        }
      }
      setSelectedIndex(null);
    }
  };

  const opponentName = matchData?.player1?.id.toString() === userId 
    ? matchData?.player2?.pseudo 
    : matchData?.player1?.pseudo;

  const myHealthDisplay = myRole === 'player1' ? p1Health : p2Health;
  const oppHealthDisplay = myRole === 'player1' ? p2Health : p1Health;

  return (
    <div className="match-masters-wrapper">
      <div className="match-header">
        <h1>Match Masters - DUEL</h1>

        <h2 style={{ textAlign: 'center', margin: '10px 0', color: currentTurn === myRole ? '#2ecc71' : '#e74c3c' }}>
          {currentTurn === myRole ? "🟢 C'EST VOTRE TOUR" : "🔴 TOUR DE L'ADVERSAIRE"}
        </h2>
        
        {/* BARRES DE VIE */}
        <div className="health-arena" style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', width: '100%', maxWidth: '500px', marginTop: '10px' }}>
          
          <div className="health-card" style={{ flex: 1, textAlign: 'left' }}>
            <span style={{ fontWeight: 'bold' }}>Vous</span>
            <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden', marginTop: '5px' }}>
              <div style={{ width: `${(myHealthDisplay / 200) * 100}%`, height: '100%', backgroundColor: '#2ecc71', transition: 'width 0.3s ease' }}></div>
            </div>
            <span>{myHealthDisplay} / 200 HP</span>
          </div>

          <div className="health-card" style={{ flex: 1, textAlign: 'right' }}>
            <span style={{ fontWeight: 'bold' }}>{opponentName || 'Adversaire'}</span>
            <div style={{ width: '100%', height: '20px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden', marginTop: '5px', direction: 'rtl' }}>
              <div style={{ width: `${(oppHealthDisplay / 200) * 100}%`, height: '100%', backgroundColor: '#e74c3c', transition: 'width 0.3s ease' }}></div>
            </div>
            <span>{oppHealthDisplay} / 200 HP</span>
          </div>

        </div>
      </div>

      <div className="block-board" style={{ marginTop: '20px' }}>
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
          <p style={{fontSize: "20px", marginBottom: '30px', color: 'white'}}>
            {matchResult === 'victory' ? "Tu as écrasé ton adversaire !" : "Ton adversaire a été plus malin..."}
          </p>
          <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ padding: '15px 30px', fontSize: '18px' }}>Retour au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default MatchMastersGame;