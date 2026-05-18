import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { matchService } from '../../services/api';

const BrawlbotsGame = () => {
  const { jeuId } = useParams();
  const navigate = useNavigate();
  const [gamePhase, setGamePhase] = useState('bot-selection'); // bot-selection, in-game, finished
  const [selectedBot, setSelectedBot] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [actions, setActions] = useState({});
  const [winner, setWinner] = useState(null);

  const BOTS = {
    ELDRITCH: {
      name: 'Eldritch',
      health: 90,
      attack: 15,
      defense: 18,
      speed: 12,
      abilities: ['Into the Void', 'Existential Dread'],
      description: 'Bot orienté contrôle et chaos. Excellent en combat de zone.'
    },
    NANO: {
      name: 'Nano',
      health: 120,
      attack: 25,
      defense: 12,
      speed: 10,
      abilities: ['Explosive Cannon', 'Overcharge'],
      description: 'Bot offensif puissant. Très utilisé par les joueurs expérimentés.'
    },
    RAPTOR: {
      name: 'Raptor',
      health: 100,
      attack: 18,
      defense: 15,
      speed: 16,
      abilities: ['Bouncing Grenade', 'Shield Bash'],
      description: 'Bot polyvalent et tactique. Excellent pour surprendre les ennemis.'
    }
  };

  const selectBot = (botType) => {
    setSelectedBot(botType);
    const newPlayer = {
      id: localStorage.getItem('userId'),
      name: localStorage.getItem('userPseudo'),
      bot: botType,
      health: BOTS[botType].health,
      maxHealth: BOTS[botType].health,
      isAlive: true,
      score: 0
    };
    setPlayers([...players, newPlayer]);
    
    if (players.length + 1 >= 2) {
      setGamePhase('in-game');
    }
  };

  const handleAction = (action) => {
    const userId = localStorage.getItem('userId');
    setActions({
      ...actions,
      [userId]: action
    });
  };

  const executeRound = () => {
    // Simulate round execution
    const updatedPlayers = players.map(p => {
      if (!p.isAlive) return p;
      
      const damage = Math.floor(Math.random() * 20) + 10;
      const newHealth = p.health - damage;
      
      return {
        ...p,
        health: Math.max(0, newHealth),
        isAlive: newHealth > 0
      };
    });

    setPlayers(updatedPlayers);
    setCurrentRound(currentRound + 1);
    setActions({});

    // Check for winner
    const alive = updatedPlayers.filter(p => p.isAlive);
    if (alive.length === 1) {
      setWinner(alive[0]);
      setGamePhase('finished');
    }
  };

  const returnToLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="brawlbots-container">
      <h1>Brawlbots - Combat de Robots</h1>

      {gamePhase === 'bot-selection' && (
        <div className="bot-selection">
          <h2>Choisissez votre Robot</h2>
          <div className="bots-grid">
            {Object.entries(BOTS).map(([key, bot]) => (
              <div key={key} className="bot-card" onClick={() => selectBot(key)}>
                <h3>{bot.name}</h3>
                <p className="description">{bot.description}</p>
                <div className="bot-stats">
                  <div>❤️ {bot.health} HP</div>
                  <div>⚔️ {bot.attack} ATK</div>
                  <div>🛡️ {bot.defense} DEF</div>
                  <div>⚡ {bot.speed} SPD</div>
                </div>
                <div className="abilities">
                  {bot.abilities.map((ability, i) => (
                    <span key={i} className="ability-badge">{ability}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gamePhase === 'in-game' && (
        <div className="game-arena">
          <div className="round-info">
            <h2>Round {currentRound + 1}</h2>
          </div>

          <div className="players-display">
            {players.map((player, idx) => (
              <div key={idx} className={`player-card ${!player.isAlive ? 'eliminated' : ''}`}>
                <h3>{player.name}</h3>
                <div className="bot-name">{BOTS[player.bot].name}</div>
                <div className="health-bar">
                  <div 
                    className="health-fill" 
                    style={{ width: `${(player.health / player.maxHealth) * 100}%` }}
                  />
                </div>
                <div className="health-text">{player.health}/{player.maxHealth}</div>
                {player.isAlive && (
                  <div className="actions-buttons">
                    <button onClick={() => handleAction('ATTACK')} className="action-btn attack">
                      ⚔️ Attaquer
                    </button>
                    <button onClick={() => handleAction('DEFEND')} className="action-btn defend">
                      🛡️ Défendre
                    </button>
                    <button onClick={() => handleAction('SPECIAL')} className="action-btn special">
                      ✨ Spécial
                    </button>
                    <button onClick={() => handleAction('JUMP')} className="action-btn jump">
                      🦘 Sauter
                    </button>
                  </div>
                )}
                {!player.isAlive && <div className="eliminated-text">ÉLIMINÉ</div>}
              </div>
            ))}
          </div>

          <button onClick={executeRound} className="btn-execute-round">
            Exécuter le Round
          </button>
        </div>
      )}

      {gamePhase === 'finished' && (
        <div className="game-result">
          <h2>🏆 Victoire!</h2>
          <div className="winner-info">
            <h3>{winner.name}</h3>
            <p>Bot: {BOTS[winner.bot].name}</p>
            <p>Rounds: {currentRound}</p>
          </div>
          <button onClick={returnToLobby} className="btn-back-lobby">
            Retour au Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default BrawlbotsGame;
