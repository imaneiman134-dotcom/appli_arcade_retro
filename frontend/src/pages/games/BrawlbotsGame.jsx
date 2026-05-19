import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './brawlbots.css'; // Vous devrez créer ce fichier pour les animations

const BrawlbotsGame = () => {
  const navigate = useNavigate();
  const [gamePhase, setGamePhase] = useState('in-game'); // Simplifié pour la démo visuelle
  
  // États des joueurs
  const [player1, setPlayer1] = useState({ id: 'p1', name: 'Vous', health: 100, maxHealth: 100, action: null, effect: null });
  const [player2, setPlayer2] = useState({ id: 'p2', name: 'Adversaire', health: 100, maxHealth: 100, action: null, effect: null });
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [roundMessage, setRoundMessage] = useState("Choisissez votre action !");

  // Vérifie si les deux joueurs ont choisi une action
  useEffect(() => {
    if (player1.action && player2.action && !isAnimating) {
      resolveRound();
    }
  }, [player1.action, player2.action]);

  const handleActionClick = (actionType) => {
    if (isAnimating || player1.action) return;
    
    setPlayer1(prev => ({ ...prev, action: actionType }));
    setRoundMessage("En attente de l'adversaire...");
    
    // SIMULATION : L'adversaire joue aléatoirement après 1 seconde
    setTimeout(() => {
       const actions = ['ATTACK', 'DEFEND'];
       setPlayer2(prev => ({ ...prev, action: actions[Math.floor(Math.random() * actions.length)] }));
    }, 1000);
  };

  const resolveRound = () => {
    setIsAnimating(true);
    setRoundMessage("RÉSOLUTION !");

    // 1. Appliquer les effets visuels (Feu, Bouclier)
    setPlayer1(prev => ({ ...prev, effect: prev.action }));
    setPlayer2(prev => ({ ...prev, effect: prev.action }));

    // 2. Attendre que l'animation CSS se termine (ex: 2 secondes), puis calculer les dégâts
    setTimeout(() => {
      let p1DamageTaken = 0;
      let p2DamageTaken = 0;

      // Logique simple pour la démo
      if (player1.action === 'ATTACK' && player2.action !== 'DEFEND') p2DamageTaken = 20;
      if (player1.action === 'ATTACK' && player2.action === 'DEFEND') p2DamageTaken = 5; // Dégâts réduits
      
      if (player2.action === 'ATTACK' && player1.action !== 'DEFEND') p1DamageTaken = 20;
      if (player2.action === 'ATTACK' && player1.action === 'DEFEND') p1DamageTaken = 5;

      // Mettre à jour la vie, retirer les effets et réinitialiser les actions
      setPlayer1(prev => ({ ...prev, health: Math.max(0, prev.health - p1DamageTaken), action: null, effect: null }));
      setPlayer2(prev => ({ ...prev, health: Math.max(0, prev.health - p2DamageTaken), action: null, effect: null }));
      
      setIsAnimating(false);
      setRoundMessage("Nouveau round ! Choisissez une action.");
    }, 2000); // 2000ms correspond à la durée de votre animation CSS
  };

  return (
    <div className="brawlbots-arena">
      <div className="arena-header">
        <h1>Brawlbots</h1>
        <div className="round-status">{roundMessage}</div>
      </div>

      <div className="battlefield">
        {/* JOUEUR 1 (GAUCHE) */}
        <div className={`bot-container left ${player1.effect === 'ATTACK' ? 'attacking' : ''}`}>
          <div className="health-bar-container">
            <div className="health-bar" style={{ width: `${(player1.health / player1.maxHealth) * 100}%` }}></div>
          </div>
          <div className="bot-sprite">
            🤖 {/* Remplacez par une vraie image */}
            {player1.effect === 'DEFEND' && <div className="shield-effect">🛡️</div>}
            {player1.effect === 'ATTACK' && <div className="fire-effect">🔥</div>}
          </div>
          <h3>{player1.name}</h3>
        </div>

        <div className="vs-badge">VS</div>

        {/* JOUEUR 2 (DROITE) */}
        <div className={`bot-container right ${player2.effect === 'ATTACK' ? 'attacking' : ''}`}>
          <div className="health-bar-container">
            <div className="health-bar" style={{ width: `${(player2.health / player2.maxHealth) * 100}%` }}></div>
          </div>
          <div className="bot-sprite">
            👾 {/* Remplacez par une vraie image */}
            {player2.effect === 'DEFEND' && <div className="shield-effect">🛡️</div>}
            {player2.effect === 'ATTACK' && <div className="fire-effect">🔥</div>}
          </div>
          <h3>{player2.name}</h3>
        </div>
      </div>

      {/* PANNEAU DE CONTRÔLE */}
      <div className="control-panel">
        <button 
          className={`btn-action attack ${player1.action === 'ATTACK' ? 'selected' : ''}`}
          onClick={() => handleActionClick('ATTACK')}
          disabled={isAnimating || player1.action}
        >
          ⚔️ Attaquer
        </button>
        <button 
          className={`btn-action defend ${player1.action === 'DEFEND' ? 'selected' : ''}`}
          onClick={() => handleActionClick('DEFEND')}
          disabled={isAnimating || player1.action}
        >
          🛡️ Défendre
        </button>
      </div>
    </div>
  );
};

export default BrawlbotsGame;