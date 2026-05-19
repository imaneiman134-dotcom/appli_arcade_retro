import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
import './battleship.css'; 

const BattleshipGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState('setup'); 
  const [myGrid, setMyGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [opponentGrid, setOpponentGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [shipsToPlace, setShipsToPlace] = useState([5, 4, 3, 3, 2]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [gameMode, setGameMode] = useState(matchId ? 'multiplayer' : 'local');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(matchId ? true : false);
  const [orientation, setOrientation] = useState('horizontal'); 
  
  const userId = localStorage.getItem('userId');
  const userPseudo = localStorage.getItem('userPseudo');

  useEffect(() => {
    if (matchId) fetchMatchData();
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
      if (currentShipIndex + 1 === shipsToPlace.length) setPhase('play');

    } else if (phase === 'play') {
      if (opponentGrid[row][col]) return; 

      const newGrid = opponentGrid.map(r => [...r]);
      const isHit = Math.random() > 0.7; 
      newGrid[row][col] = isHit ? 'hit' : 'miss';
      setOpponentGrid(newGrid);
      
      if (isHit) {
        const newHits = hits + 1;
        setHits(newHits);
        if (newHits >= 17) { 
          setPhase('finished');
          if (userId && jeuId && gameMode === 'local') {
            scoreService.saveScore(userId, jeuId, 100);
          }
          if (matchId && matchData) {
            matchService.setMatchWinner(matchId, userId);
          }
        }
      }
    }
  };

  const handleReset = () => {
    setMyGrid(Array(10).fill(null).map(() => Array(10).fill(null)));
    setCurrentShipIndex(0);
    setPhase('setup');
  };

  if (loading) return <div className="loading">Chargement du match...</div>;

  const player1Name = matchData?.player1?.pseudo || 'Joueur 1';
  const player2Name = matchData?.player2?.pseudo || 'Joueur 2';

  return (
    <div className="battleship-arena">
      <div className="radar-header">
        <h1>⚓ Bataille Navale</h1>
      </div>
      
      {gameMode === 'multiplayer' && matchData && (
        <div className="multiplayer-info">
          <span className="player-name">{player1Name}</span>
          <span className="vs"> VS </span>
          <span className="player-name">{player2Name}</span>
        </div>
      )}

      {phase === 'setup' && (
        <div className="tactical-panel">
          <h2>Déploiement de la flotte</h2>
          <p>Placez votre navire de taille <strong>{shipsToPlace[currentShipIndex]}</strong></p>
          <div className="orientation-controls">
            <button 
              className={`btn-orientation ${orientation === 'horizontal' ? 'active' : ''}`}
              onClick={() => setOrientation('horizontal')}
            >
              → Horizontal
            </button>
            <button 
              className={`btn-orientation ${orientation === 'vertical' ? 'active' : ''}`}
              onClick={() => setOrientation('vertical')}
            >
              ↓ Vertical
            </button>
          </div>
          <div className="ocean-grid">
            {myGrid.map((row, rIdx) => row.map((cell, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`ocean-cell ${cell || 'water'}`} 
                onClick={() => handleCellClick(rIdx, cIdx)}
              />
            )))}
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="tactical-panel">
          <h2>Phase d'Attaque</h2>
          <p>Ciblez la grille adverse ! Coups réussis: <strong>{hits} / 17</strong></p>
          <div className="ocean-grid target-grid">
            {opponentGrid.map((row, rIdx) => row.map((cell, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`ocean-cell ${cell || 'water-unknown'}`} 
                onClick={() => handleCellClick(rIdx, cIdx)}
              />
            )))}
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="victory-screen">
          <h2>🏆 Victoire ! Tous les navires coulés.</h2>
          <p>Vous avez remporté la partie en {hits} coups !</p>
          <button onClick={handleReset} className="btn-secondary" style={{marginRight: "10px"}}>Nouvelle partie</button>
          <button onClick={() => navigate('/lobby')} className="btn-secondary">Retour au Lobby</button>
        </div>
      )}
    </div>
  );
};

export default BattleshipGame;