import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';

const BattleshipGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  const [phase, setPhase] = useState('setup'); // setup, play, finished
  const [myGrid, setMyGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [opponentGrid, setOpponentGrid] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [shipsToPlace, setShipsToPlace] = useState([5, 4, 3, 3, 2]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [gameMode, setGameMode] = useState(matchId ? 'multiplayer' : 'local');
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(matchId ? true : false);
  const [orientation, setOrientation] = useState('horizontal'); // horizontal or vertical
  
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

  const handleCellClick = (row, col) => {
    if (phase === 'setup') {
      if (currentShipIndex >= shipsToPlace.length) return;
      
      const size = shipsToPlace[currentShipIndex];
      
      // Check if placement is valid
      if (orientation === 'horizontal') {
        if (col + size > 10) return; // Out of bounds
        const newGrid = myGrid.map(r => [...r]);
        for (let i = 0; i < size; i++) {
          if (newGrid[row][col + i]) return; // Space occupied
        }
        for (let i = 0; i < size; i++) {
          newGrid[row][col + i] = 'ship';
        }
        setMyGrid(newGrid);
      } else {
        if (row + size > 10) return; // Out of bounds
        const newGrid = myGrid.map(r => [...r]);
        for (let i = 0; i < size; i++) {
          if (newGrid[row + i][col]) return; // Space occupied
        }
        for (let i = 0; i < size; i++) {
          newGrid[row + i][col] = 'ship';
        }
        setMyGrid(newGrid);
      }
      
      setCurrentShipIndex(currentShipIndex + 1);
      if (currentShipIndex + 1 === shipsToPlace.length) {
        setPhase('play');
      }
    } else if (phase === 'play') {
      if (opponentGrid[row][col]) return; // Already targeted

      const newGrid = opponentGrid.map(r => [...r]);
      const isHit = Math.random() > 0.7; // Simulate hit for now (30% hit rate)
      newGrid[row][col] = isHit ? 'hit' : 'miss';
      setOpponentGrid(newGrid);
      
      if (isHit) {
        const newHits = hits + 1;
        setHits(newHits);
        if (newHits >= 17) { // Total ship cells = 5+4+3+3+2 = 17
          setPhase('finished');
          
          // Save score for single player
          if (userId && jeuId && gameMode === 'local') {
            scoreService.saveScore(userId, jeuId, 100);
          }
          
          // Update match if multiplayer
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
    <div className="battleship-container">
      <h1>⚓ Bataille Navale</h1>
      
      {gameMode === 'multiplayer' && matchData && (
        <div className="multiplayer-info">
          <div className="player-info">
            <span className="player-name">{player1Name}</span>
          </div>
          <span className="vs">VS</span>
          <div className="player-info">
            <span className="player-name">{player2Name}</span>
          </div>
        </div>
      )}

      {phase === 'setup' && (
        <div className="setup-info">
          <p>Placez votre navire de taille <strong>{shipsToPlace[currentShipIndex]}</strong></p>
          <div className="orientation-toggle">
            <button 
              className={`orientation-btn ${orientation === 'horizontal' ? 'active' : ''}`}
              onClick={() => setOrientation('horizontal')}
            >
              → Horizontal
            </button>
            <button 
              className={`orientation-btn ${orientation === 'vertical' ? 'active' : ''}`}
              onClick={() => setOrientation('vertical')}
            >
              ↓ Vertical
            </button>
          </div>
          <p className="progress">Navires placés: {currentShipIndex} / {shipsToPlace.length}</p>
          <div className="setup-grid">
            {myGrid.map((row, rIdx) => row.map((cell, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`grid-cell ${cell}`} 
                onClick={() => handleCellClick(rIdx, cIdx)}
                title={`${String.fromCharCode(65 + cIdx)}${rIdx + 1}`}
              />
            )))}
          </div>
        </div>
      )}

      {phase === 'play' && (
        <div className="play-info">
          <p>Ciblez la grille adverse ! Coups réussis: <strong>{hits} / 17</strong></p>
          <div className="opponent-grid">
            {opponentGrid.map((row, rIdx) => row.map((cell, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`grid-cell ${cell}`} 
                onClick={() => handleCellClick(rIdx, cIdx)}
                title={`${String.fromCharCode(65 + cIdx)}${rIdx + 1}`}
              />
            )))}
          </div>
        </div>
      )}

      {phase === 'finished' && (
        <div className="game-overlay">
          <h2>🏆 Victoire ! Tous les navires coulés.</h2>
          <p>Vous avez remporté la partie en {hits} coups !</p>
          <div className="overlay-buttons">
            <button onClick={handleReset} className="btn-secondary">Nouvelle partie</button>
            <button onClick={() => navigate('/lobby')} className="btn-secondary">Retour au Lobby</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleshipGame;
