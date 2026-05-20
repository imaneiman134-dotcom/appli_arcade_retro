import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './battleship.css'; 

const BattleshipGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  // États du jeu
  const [phase, setPhase] = useState('setup');
  const [myGrid, setMyGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [opponentGrid, setOpponentGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  
  const [shipsToPlace, setShipsToPlace] = useState([5, 4, 3, 3, 2]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [orientation, setOrientation] = useState('horizontal'); 
  
  // Multijoueur
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stompClient, setStompClient] = useState(null);
  const [playerRole, setPlayerRole] = useState(null); 
  const [currentPlayer, setCurrentPlayer] = useState('player1');
  
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  
  const [myHits, setMyHits] = useState(0); 
  const [opponentHits, setOpponentHits] = useState(0); 
  
  const userId = localStorage.getItem('userId');

  const myGridRef = useRef(myGrid);
  const phaseRef = useRef(phase);
  const myReadyRef = useRef(myReady);
  
  useEffect(() => { myGridRef.current = myGrid; }, [myGrid]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { myReadyRef.current = myReady; }, [myReady]);

  useEffect(() => {
    if (!matchId || !userId) return;

    const fetchMatchDataAndConnect = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        const match = res.data;
        setMatchData(match);
        
        let role = null;
        if (match.player1?.id.toString() === userId) role = 'player1';
        else if (match.player2?.id.toString() === userId) role = 'player2';
        setPlayerRole(role);

        // FIX LAN : On utilise l'IP de la machine locale
        const currentHost = window.location.hostname;
        const socket = new SockJS(`http://${currentHost}:8080/ws-arcade`);
        const client = new Client({
          webSocketFactory: () => socket,
          onConnect: () => {
            console.log(`Connecté à la Bataille Navale (Match ${matchId})`);
            client.subscribe(`/topic/game/${matchId}`, (message) => {
              const move = JSON.parse(message.body);
              handleNetworkMessage(move.position, move.role, move.playerId, client);
            });
          }
        });

        client.activate();
        setStompClient(client);
        setLoading(false);
      } catch (err) {
        console.error('Erreur:', err);
        setLoading(false);
      }
    };

    fetchMatchDataAndConnect();
    return () => { if (stompClient) stompClient.deactivate(); };
  }, [matchId, userId]);

  useEffect(() => {
    if (myReady && opponentReady && phase === 'waiting') {
      setPhase('play');
    }
  }, [myReady, opponentReady, phase]);

  const handleNetworkMessage = (position, action, senderId, activeClient) => {
    const row = Math.floor(position / 10);
    const col = position % 10;

    if (action === 'READY' && senderId.toString() !== userId) {
      setOpponentReady(true);
      
      if (myReadyRef.current && phaseRef.current === 'waiting') {
        activeClient.publish({
          destination: '/app/game.move',
          body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: -1, role: 'READY' })
        });
      }
    } 
    else if (action === 'ATTACK' && senderId.toString() !== userId) {
      if (phaseRef.current === 'waiting') setPhase('play');

      const cell = myGridRef.current[row][col];
      const isHit = cell !== null && cell.includes('ship');

      activeClient.publish({
        destination: '/app/game.move',
        body: JSON.stringify({
          matchId: parseInt(matchId),
          playerId: parseInt(userId), 
          position: position,
          role: isHit ? 'HIT' : 'MISS'
        })
      });
    } 
    else if (action === 'HIT' || action === 'MISS') {
      if (senderId.toString() !== userId) {
        setOpponentGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          newGrid[row][col] = action === 'HIT' ? 'hit' : 'miss';
          return newGrid;
        });
        
        if (action === 'HIT') {
          setMyHits(prev => {
            const next = prev + 1;
            if (next >= 17) setTimeout(() => endGame('victory'), 500); 
            return next;
          });
        }
      } else {
        setMyGrid(prev => {
          const newGrid = prev.map(r => [...r]);
          const currentCell = newGrid[row][col] || '';
          newGrid[row][col] = currentCell + (action === 'HIT' ? ' hit' : ' miss');
          return newGrid;
        });
        
        if (action === 'HIT') setOpponentHits(prev => prev + 1);
      }
      
      setCurrentPlayer(prev => prev === 'player1' ? 'player2' : 'player1');
    }
  };

  const endGame = async (status) => {
    setPhase('finished');
    if (status === 'victory') {
      try {
        await scoreService.saveScore(parseInt(userId), parseInt(jeuId), 50); 
        await matchService.setMatchWinner(matchId, userId);
      } catch(e) { console.error(e); }
    }
  };

  const handleCellClick = (row, col) => {
    if (phase === 'setup') {
      if (currentShipIndex >= shipsToPlace.length) return;
      const size = shipsToPlace[currentShipIndex];
      const newGrid = myGrid.map(r => [...r]);

      if (orientation === 'horizontal') {
        if (col + size > 10) return; 
        for (let i = 0; i < size; i++) if (newGrid[row][col + i]) return; 
        for (let i = 0; i < size; i++) {
          const part = i === 0 ? 'head' : (i === size - 1 ? 'tail' : 'body');
          newGrid[row][col + i] = `ship horizontal ${part}`;
        }
      } else {
        if (row + size > 10) return; 
        for (let i = 0; i < size; i++) if (newGrid[row + i][col]) return; 
        for (let i = 0; i < size; i++) {
          const part = i === 0 ? 'head' : (i === size - 1 ? 'tail' : 'body');
          newGrid[row + i][col] = `ship vertical ${part}`;
        }
      }
      
      setMyGrid(newGrid);
      setCurrentShipIndex(currentShipIndex + 1);
      
      if (currentShipIndex + 1 === shipsToPlace.length) {
        setMyReady(true);
        setPhase('waiting');
        
        if (stompClient && stompClient.connected) {
            stompClient.publish({
            destination: '/app/game.move',
            body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: -1, role: 'READY' })
            });
        }
      }
    } 
    else if (phase === 'play') {
      if (currentPlayer !== playerRole) {
          console.log("Ce n'est pas votre tour de jouer !");
          return;
      }
      if (opponentGrid[row][col] === 'hit' || opponentGrid[row][col] === 'miss') return; 

      stompClient.publish({
        destination: '/app/game.move',
        body: JSON.stringify({ matchId: parseInt(matchId), playerId: parseInt(userId), position: (row * 10) + col, role: 'ATTACK' })
      });
    }
  };

  if (loading) return <div className="loading">Chargement de la zone de combat...</div>;

  const player1Name = matchData?.player1?.pseudo || 'Joueur 1';
  const player2Name = matchData?.player2?.pseudo || 'Joueur 2';

  return (
    <div className="battleship-arena">
      <div className="radar-header">
        <h1>⚓ Bataille Navale Multijoueur</h1>
      </div>
      
      <div className="multiplayer-info" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <p>Amiral : <strong style={{ color: '#3498db' }}>{playerRole === 'player1' ? player1Name : player2Name}</strong></p>
      </div>

      {phase === 'setup' && (
        <div className="tactical-panel">
          <h2>Déploiement de la flotte</h2>
          <p>Placez votre navire de taille <strong>{shipsToPlace[currentShipIndex]}</strong></p>
          <div className="orientation-controls">
            <button className={`btn-orientation ${orientation === 'horizontal' ? 'active' : ''}`} onClick={() => setOrientation('horizontal')}>→ Horizontal</button>
            <button className={`btn-orientation ${orientation === 'vertical' ? 'active' : ''}`} onClick={() => setOrientation('vertical')}>↓ Vertical</button>
          </div>
          <div className="ocean-grid">
            {myGrid.map((row, rIdx) => row.map((cell, cIdx) => (
              <div key={`${rIdx}-${cIdx}`} className={`ocean-cell ${cell || 'water'}`} onClick={() => handleCellClick(rIdx, cIdx)} />
            )))}
          </div>
        </div>
      )}

      {phase === 'waiting' && (
        <div className="tactical-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Flotte déployée !</h2>
          <p className="pulsing-text">En attente du déploiement ennemi...</p>
        </div>
      )}

      {phase === 'play' && (
        <div className="tactical-panel" style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          
          <div style={{ textAlign: 'center', width: '100%' }}>
            <h2 style={{
              color: currentPlayer === playerRole ? '#2ecc71' : '#e74c3c',
              padding: '10px', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '10px'
            }}>
              {currentPlayer === playerRole ? "À VOUS DE TIRER !" : "L'ENNEMI VISE..."}
            </h2>
          </div>

          <div>
            <h3>Radar Offensif (Adversaire)</h3>
            <p>Frappes réussies : {myHits} / 17</p>
            <div className="ocean-grid target-grid">
              {opponentGrid.map((row, rIdx) => row.map((cell, cIdx) => (
                <div 
                  key={`${rIdx}-${cIdx}`} 
                  className={`ocean-cell ${cell || 'water-unknown'}`} 
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  style={{ cursor: currentPlayer === playerRole && !cell ? 'crosshair' : 'not-allowed' }}
                />
              )))}
            </div>
          </div>

          <div>
            <h3>Votre Flotte</h3>
            <p>Dégâts subis : {opponentHits} / 17</p>
            <div className="ocean-grid">
              {myGrid.map((row, rIdx) => row.map((cell, cIdx) => (
                <div key={`${rIdx}-${cIdx}`} className={`ocean-cell ${cell || 'water'}`} />
              )))}
            </div>
          </div>

        </div>
      )}

      {phase === 'finished' && (
        <div className="victory-screen" style={{ textAlign: 'center', marginTop: '20px' }}>
          <h2>{myHits >= 17 ? 'VICTOIRE ! Flotte ennemie anéantie.' : 'DÉFAITE. Votre flotte a coulé.'}</h2>
          <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ marginTop: '20px' }}>Retourner au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default BattleshipGame;