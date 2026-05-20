import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { scoreService, matchService } from '../../services/api';
// IMPORT DU NOUVEAU HOOK (Ajustez le chemin selon l'arborescence de votre projet)
import { useMultiplayerSync } from '../../hooks/useMultiplayerSync';
import './brawlbots.css';

const BrawlbotsGame = () => {
  const { jeuId } = useParams();
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get('matchId');
  const navigate = useNavigate();
  
  // États de la partie
  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [roundMessage, setRoundMessage] = useState("Choisissez votre action !");
  const [isAnimating, setIsAnimating] = useState(false);

  // Mon profil
  const userId = localStorage.getItem('userId');
  const authToken = localStorage.getItem('authToken'); // Ajout pour la sécurité WebSocket
  const [myName, setMyName] = useState("Vous");
  const [myHealth, setMyHealth] = useState(100);
  const [myAction, setMyAction] = useState(null);
  const [myEffect, setMyEffect] = useState(null);

  // Profil de l'Adversaire
  const [opponentName, setOpponentName] = useState("Adversaire");
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [opponentAction, setOpponentAction] = useState(null);
  const [opponentEffect, setOpponentEffect] = useState(null);
  const [opponentHasPlayed, setOpponentHasPlayed] = useState(false);

  // --- NOUVEAU SYSTÈME DE SYNCHRONISATION MULTIJOUEUR ---
  const handleMessageReceived = (message) => {
    const action = message.actionType;
    
    // Le hook filtre déjà nos propres messages, donc on sait que ça vient de l'adversaire
    if (action === 'ATTACK' || action === 'DEFEND') {
      setOpponentAction(action);
      setOpponentHasPlayed(true);
    }
  };

  const { isConnected, sendSyncEvent } = useMultiplayerSync(
    matchId,
    userId,
    authToken,
    handleMessageReceived
  );
  // ------------------------------------------------------

  useEffect(() => {
    if (!matchId || !userId) return;

    const fetchMatchData = async () => {
      try {
        const res = await matchService.getMatch(matchId);
        const match = res.data;
        setMatchData(match);
        
        if (match.player1?.id.toString() === userId) {
          setMyName(match.player1.pseudo);
          setOpponentName(match.player2?.pseudo || "Joueur 2");
        } else {
          setMyName(match.player2?.pseudo || "Joueur 2");
          setOpponentName(match.player1?.pseudo || "Joueur 1");
        }

        setLoading(false);

      } catch (err) {
        console.error("Erreur d'initialisation:", err);
        setLoading(false);
      }
    };

    fetchMatchData();
    // Plus besoin d'initialiser manuellement SockJS, le hook s'en occupe !
  }, [matchId, userId]);

  useEffect(() => {
    if (myAction && opponentAction && !isAnimating && !gameOver) {
      resolveRound(myAction, opponentAction);
    }
  }, [myAction, opponentAction, isAnimating, gameOver]);

  useEffect(() => {
    if ((myHealth === 0 || opponentHealth === 0) && !gameOver) {
      handleGameOver(myHealth, opponentHealth);
    }
  }, [myHealth, opponentHealth, gameOver]);

  const handleActionClick = (actionType) => {
    if (isAnimating || myAction || gameOver) return;
    
    // 1. Enregistre l'action localement
    setMyAction(actionType);
    setRoundMessage(opponentHasPlayed ? "Résolution imminente..." : "En attente de l'adversaire...");
    
    // 2. Envoie l'action à l'adversaire via le hook
    if (isConnected) {
      sendSyncEvent(actionType, {}); 
    } else {
      console.warn("Attente de connexion réseau...");
    }
  };

  const resolveRound = (me, opp) => {
    setIsAnimating(true);
    setRoundMessage("RÉSOLUTION !");

    setMyEffect(me);
    setOpponentEffect(opp);

    setTimeout(() => {
      let myDmgTaken = 0;
      let oppDmgTaken = 0;

      if (me === 'ATTACK' && opp !== 'DEFEND') oppDmgTaken = 20;
      if (me === 'ATTACK' && opp === 'DEFEND') oppDmgTaken = 5;
      
      if (opp === 'ATTACK' && me !== 'DEFEND') myDmgTaken = 20;
      if (opp === 'ATTACK' && me === 'DEFEND') myDmgTaken = 5;

      setMyHealth(prev => Math.max(0, prev - myDmgTaken));
      setOpponentHealth(prev => Math.max(0, prev - oppDmgTaken));
      
      setMyAction(null);
      setOpponentAction(null);
      setMyEffect(null);
      setOpponentEffect(null);
      setOpponentHasPlayed(false);
      
      setIsAnimating(false);
      if (myHealth - myDmgTaken > 0 && opponentHealth - oppDmgTaken > 0) {
          setRoundMessage("Nouveau round ! Choisissez une action.");
      }
    }, 2000); 
  };

  const handleGameOver = async (finalMyHealth, finalOppHealth) => {
    setGameOver(true);
    setIsAnimating(false);
    
    let endMsg = "";
    if (finalMyHealth === 0 && finalOppHealth === 0) {
      endMsg = "Égalité ! Les deux robots sont détruits.";
    } else if (finalOppHealth === 0) {
      endMsg = "VICTOIRE ! Vous avez détruit l'adversaire ! (+20 pts)";
      try {
        await scoreService.saveScore(parseInt(userId), parseInt(jeuId), 20);
        await matchService.setMatchWinner(matchId, userId);
      } catch (e) { console.error(e); }
    } else {
      endMsg = "DÉFAITE. Votre robot est en pièces...";
    }
    setRoundMessage(endMsg);
  };

  if (loading) return <div className="loading">Mise sous tension des Brawlbots...</div>;

  return (
    <div className="brawlbots-arena">
      <div className="arena-header">
        <h1>Brawlbots Multijoueur</h1>
        <div className={`round-status ${gameOver ? 'game-over' : ''}`}>{roundMessage}</div>
      </div>

      <div className="battlefield">
        {/* MON BOT (GAUCHE) */}
        <div className={`bot-container left ${myEffect === 'ATTACK' ? 'attacking' : ''}`}>
          
          <div className="health-bar-container" style={{ border: '2px solid white', width: '100%', height: '25px', backgroundColor: '#333', position: 'relative', borderRadius: '5px', overflow: 'hidden' }}>
            <div className="health-bar" style={{ width: `${myHealth}%`, backgroundColor: myHealth > 30 ? '#2ecc71' : '#e74c3c', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
            <span style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontWeight: 'bold', textShadow: '1px 1px 2px black', fontSize: '14px' }}>
                {myHealth} / 100
            </span>
          </div>

          <div className="bot-sprite">
            🤖
            {myEffect === 'DEFEND' && <div className="shield-effect">🛡️</div>}
            {myEffect === 'ATTACK' && <div className="fire-effect">🔥</div>}
          </div>
          <h3>{myName} (Vous)</h3>
        </div>

        <div className="vs-badge">VS</div>

        {/* BOT ADVERSE (DROITE) */}
        <div className={`bot-container right ${opponentEffect === 'ATTACK' ? 'attacking' : ''}`}>
          
          <div className="health-bar-container" style={{ border: '2px solid white', width: '100%', height: '25px', backgroundColor: '#333', position: 'relative', borderRadius: '5px', overflow: 'hidden' }}>
            <div className="health-bar" style={{ width: `${opponentHealth}%`, backgroundColor: opponentHealth > 30 ? '#e67e22' : '#e74c3c', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
            <span style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', color: 'white', fontWeight: 'bold', textShadow: '1px 1px 2px black', fontSize: '14px' }}>
                {opponentHealth} / 100
            </span>
          </div>

          <div className="bot-sprite">
            👾
            {opponentEffect === 'DEFEND' && <div className="shield-effect">🛡️</div>}
            {opponentEffect === 'ATTACK' && <div className="fire-effect">🔥</div>}
            {opponentHasPlayed && !isAnimating && !gameOver && <div className="ready-indicator">Prêt</div>}
          </div>
          <h3>{opponentName}</h3>
        </div>
      </div>

      {/* PANNEAU DE CONTRÔLE */}
      {!gameOver ? (
        <div className="control-panel">
          <button 
            className={`btn-action attack ${myAction === 'ATTACK' ? 'selected' : ''}`}
            onClick={() => handleActionClick('ATTACK')}
            disabled={isAnimating || myAction}
          >
            ⚔️ Attaquer
          </button>
          <button 
            className={`btn-action defend ${myAction === 'DEFEND' ? 'selected' : ''}`}
            onClick={() => handleActionClick('DEFEND')}
            disabled={isAnimating || myAction}
          >
            🛡️ Défendre
          </button>
        </div>
      ) : (
        <div className="control-panel">
          <button onClick={() => navigate('/lobby')} className="btn-secondary" style={{ padding: '15px 30px', fontSize: '1.2rem' }}>
            Retour au Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default BrawlbotsGame;