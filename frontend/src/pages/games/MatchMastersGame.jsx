import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './match-masters.css';

const width = 8;
const blockColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const COLOR_MAP = { '#ef4444': 'R', '#3b82f6': 'B', '#10b981': 'G', '#f59e0b': 'Y', '#8b5cf6': 'V', '#ec4899': 'P', '': 'E' };
const REVERSE_MAP = { 'R': '#ef4444', 'B': '#3b82f6', 'G': '#10b981', 'Y': '#f59e0b', 'V': '#8b5cf6', 'P': '#ec4899', 'E': '' };

const MatchMastersGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();

  const [currentBoard, setCurrentBoard] = useState(Array(64).fill(''));
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [p1Health, setP1Health] = useState(200);
  const [p2Health, setP2Health] = useState(200);
  const [currentTurn, setCurrentTurn] = useState('player1'); 
  const [gameOver, setGameOver] = useState(false);
  const [matchResult, setMatchResult] = useState(''); 
  const [matchData, setMatchData] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [engineReady, setEngineReady] = useState(false); 
  const [isMyTurnBlocked, setIsMyTurnBlocked] = useState(true); // contrôle l'overlay de manière réactive

  const userId = localStorage.getItem('userId');

  const boardRef = useRef(Array(64).fill(''));
  const p1HealthRef = useRef(200);
  const p2HealthRef = useRef(200);
  const currentTurnRef = useRef('player1');
  const isResolvingRef = useRef(false); 
  const gameOverRef = useRef(false);
  const isHostRef = useRef(false); 
  const myRoleRef = useRef(null);
  const stompClientRef = useRef(null);
  
  // CORRECTIF : phase d'init détectée par comptage de ticks stables consécutifs
  // isInitRef = true tant que le plateau initial n'est pas totalement stable
  const isInitRef = useRef(true);
  // Compteur de ticks consécutifs sans aucun changement ni match
  const stableTicksRef = useRef(0);
  const STABLE_TICKS_NEEDED = 3; // 3 ticks × 150ms = 450ms de stabilité = init terminée

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

  const sendSync = useCallback(() => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;
    
    const payload = JSON.stringify({
        action: 'SYNC',
        p1: p1HealthRef.current,
        p2: p2HealthRef.current,
        turn: currentTurnRef.current,
        board: boardRef.current.map(c => COLOR_MAP[c] || 'E').join('')
    });
    
    stompClientRef.current.publish({
      destination: '/app/game.move',
      body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: payload })
    });

    setCurrentBoard([...boardRef.current]);
    setP1Health(p1HealthRef.current);
    setP2Health(p2HealthRef.current);
    setCurrentTurn(currentTurnRef.current);
  }, [matchId, userId]);

  useEffect(() => {
    if (!matchId || !userId) return;

    const initGame = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        setMatchData(res.data);

        const host = res.data.player1.id.toString() === userId;
        isHostRef.current = host;
        const role = host ? 'player1' : 'player2';
        myRoleRef.current = role;
        setMyRole(role);

        if (host) {
          const randomBoard = [];
          for (let i = 0; i < width * width; i++) {
            randomBoard.push(blockColors[Math.floor(Math.random() * blockColors.length)]);
          }
          boardRef.current = randomBoard;
          setCurrentBoard([...randomBoard]);
          setEngineReady(true); 
        }

        const currentHost = window.location.hostname;
        const socket = new SockJS(`http://${currentHost}:8080/ws-arcade`);
        const client = new Client({
          webSocketFactory: () => socket,
          onConnect: () => {
            client.subscribe(`/topic/game/${matchId}`, (message) => {
              const move = JSON.parse(message.body);
              if (move.playerId.toString() === userId) return; 

              try {
                  const data = JSON.parse(move.role);
                  
                  if (isHostRef.current) {
                      if (data.action === 'HELLO') {
                          // Si l'init est déjà terminée, on sync immédiatement.
                          // Sinon, le moteur enverra le sync dès que le plateau sera stable.
                          if (!isInitRef.current) {
                              sendSync();
                          }
                      }
                      else if (data.action === 'SWAP') {
                          if (currentTurnRef.current === 'player2' && !isResolvingRef.current) {
                              const c1 = boardRef.current[data.idx1];
                              const c2 = boardRef.current[data.idx2];
                              boardRef.current[data.idx1] = c2;
                              boardRef.current[data.idx2] = c1;
                              isResolvingRef.current = true;
                              sendSync(); 
                          }
                      }
                  } else {
                      if (data.action === 'SYNC') {
                          p1HealthRef.current = data.p1;
                          p2HealthRef.current = data.p2;
                          currentTurnRef.current = data.turn;

                          // Player2 ne gère pas isResolvingRef : c'est le host qui résout.
                          // On débloque l'overlay uniquement si c'est le tour de player2.
                          isResolvingRef.current = false;
                          setIsMyTurnBlocked(data.turn !== myRoleRef.current);

                          setP1Health(data.p1);
                          setP2Health(data.p2);
                          setCurrentTurn(data.turn);
                          
                          const newBoard = data.board.split('').map(char => REVERSE_MAP[char]);
                          boardRef.current = newBoard;
                          setCurrentBoard(newBoard);
                          
                          if (data.p1 <= 0 || data.p2 <= 0) {
                              endGame(data.p1 <= 0 ? 'player2' : 'player1');
                          }
                      }
                  }
              } catch(e) { console.error("Erreur lecture réseau", e); }
            });

            if (!host) {
               client.publish({
                 destination: '/app/game.move',
                 body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: JSON.stringify({ action: 'HELLO' }) })
               });
            }
          }
        });

        client.activate();
        stompClientRef.current = client;

      } catch (err) { console.error("Erreur :", err); }
    };

    initGame();
    return () => { if (stompClientRef.current) stompClientRef.current.deactivate(); };
  }, [matchId, userId, sendSync, endGame]);

  // LE MOTEUR DE JEU
  useEffect(() => {
    if (!engineReady || !isHostRef.current) return;

    const timer = setInterval(() => {
        if (gameOverRef.current) return;

        let boardChanged = false;
        let damageThisFrame = 0;

        const checkMatch = (indices, dmg) => {
            const c = boardRef.current[indices[0]];
            if (c !== '' && indices.every(sq => boardRef.current[sq] === c)) {
                damageThisFrame += dmg;
                indices.forEach(sq => boardRef.current[sq] = '');
                return true;
            }
            return false;
        };

        for (let i = 0; i <= 39; i++) if (checkMatch([i, i + width, i + width * 2, i + width * 3], 40)) boardChanged = true;
        const invalidRow4 = [5, 6, 7, 13, 14, 15, 21, 22, 23, 29, 30, 31, 37, 38, 39, 45, 46, 47, 53, 54, 55, 61, 62, 63];
        for (let i = 0; i < 64; i++) if (!invalidRow4.includes(i) && checkMatch([i, i + 1, i + 2, i + 3], 40)) boardChanged = true;
        
        for (let i = 0; i <= 47; i++) if (checkMatch([i, i + width, i + width * 2], 30)) boardChanged = true;
        const invalidRow3 = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
        for (let i = 0; i < 64; i++) if (!invalidRow3.includes(i) && checkMatch([i, i + 1, i + 2], 30)) boardChanged = true;

        let moved = false;
        for (let i = 0; i <= 55; i++) {
            if (i < 8 && boardRef.current[i] === '') {
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

        if (damageThisFrame > 0) {
            // On applique les dégâts uniquement hors initialisation
            if (!isInitRef.current) {
                if (currentTurnRef.current === 'player1') {
                    p2HealthRef.current = Math.max(0, p2HealthRef.current - damageThisFrame);
                } else {
                    p1HealthRef.current = Math.max(0, p1HealthRef.current - damageThisFrame);
                }
            }
            // Un match a eu lieu : le plateau n'est pas encore stable
            stableTicksRef.current = 0;
            isResolvingRef.current = true; 
        }

        if (boardChanged) {
            // Le plateau a bougé (gravité ou match) : réinitialiser le compteur de stabilité
            stableTicksRef.current = 0;
        } else {
            // Tick sans changement : incrémenter le compteur
            stableTicksRef.current += 1;
        }

        // --- Fin de phase d'INITIALISATION ---
        // Le plateau est stable depuis assez longtemps : l'init est terminée
        if (isInitRef.current && stableTicksRef.current >= STABLE_TICKS_NEEDED) {
            isInitRef.current = false;
            isResolvingRef.current = false;
            stableTicksRef.current = 0;
            // Le host joue en premier : débloquer son overlay
            setIsMyTurnBlocked(currentTurnRef.current !== myRoleRef.current);
            sendSync(); // Sync final d'init : player2 reçoit le plateau stable et son tour
            return;
        }

        // --- Fin de phase de RÉSOLUTION (coup normal) ---
        // On ne traite la fin de résolution que si l'init est déjà terminée
        if (!isInitRef.current && isResolvingRef.current && !boardChanged) {
            isResolvingRef.current = false;
            currentTurnRef.current = currentTurnRef.current === 'player1' ? 'player2' : 'player1';
            setIsMyTurnBlocked(currentTurnRef.current !== myRoleRef.current);
            sendSync(); // Sync de fin de résolution : communique le nouveau tour
            return;
        }

        // Pendant la résolution (cascade, gravité) : sync pour que player2 voie les animations
        if (!isInitRef.current && boardChanged) {
            sendSync();
        }

        if (p1HealthRef.current <= 0 || p2HealthRef.current <= 0) {
            endGame(p1HealthRef.current <= 0 ? 'player2' : 'player1');
        }
        
    }, 150); 

    return () => clearInterval(timer);
  }, [engineReady, sendSync, endGame]);

  const handleSquareClick = (index) => {
    if (gameOverRef.current) return;
    if (currentTurnRef.current !== myRoleRef.current) return;
    // Pour le host, on bloque pendant la résolution et l'init.
    // Pour player2, la résolution est gérée par le host : on ne bloque que pendant l'init.
    if (isInitRef.current) return;
    if (isHostRef.current && isResolvingRef.current) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      const isAdjacent = index === selectedIndex - 1 || index === selectedIndex + 1 || index === selectedIndex - width || index === selectedIndex + width;
      if (isAdjacent) {
        if (isHostRef.current) {
            const c1 = boardRef.current[selectedIndex];
            const c2 = boardRef.current[index];
            boardRef.current[selectedIndex] = c2;
            boardRef.current[index] = c1;
            isResolvingRef.current = true;
            sendSync();
        } else {
            if (stompClientRef.current) {
                stompClientRef.current.publish({
                  destination: '/app/game.move',
                  body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: 0, role: JSON.stringify({ action: 'SWAP', idx1: selectedIndex, idx2: index }) })
                });
                // Bloquer immédiatement après envoi pour éviter un double-clic
                setIsMyTurnBlocked(true);
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

        <h2 style={{ textAlign: 'center', padding: '10px', borderRadius: '10px', backgroundColor: currentTurn === myRole ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: currentTurn === myRole ? '#2ecc71' : '#e74c3c' }}>
          {currentTurn === myRole ? "🟢 C'EST VOTRE TOUR" : "🔴 TOUR DE L'ADVERSAIRE"}
        </h2>
        
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

      <div className="block-board" style={{ position: 'relative', marginTop: '20px' }}>
        
        {isMyTurnBlocked && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, cursor: 'not-allowed', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '10px' }} />
        )}

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
        /* CORRECTIF D'AFFICHAGE : position 'fixed' avec 100vw et 100vh garantit que la boîte couvre toujours l'écran entier */
        <div className="game-over-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <h2 style={{ fontSize: '40px', color: matchResult === 'victory' ? '#2ecc71' : '#e74c3c' }}>
            {matchResult === 'victory' ? '🏆 VICTOIRE !' : '💀 K.O.'}
          </h2>
          <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ padding: '15px 30px', fontSize: '18px', marginTop: '20px' }}>Retour au QG (Lobby)</button>
        </div>
      )}
    </div>
  );
};

export default MatchMastersGame;