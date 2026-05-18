import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { scoreService } from '../../services/api';

const CAMERAS = [
  { id: 1, name: 'CAM 1 - Couloir Gauche', hasMascot: false },
  { id: 2, name: 'CAM 2 - Salle de Jeux', hasMascot: false },
  { id: 3, name: 'CAM 3 - Couloir Droit', hasMascot: false },
  { id: 4, name: 'CAM 4 - Scène', hasMascot: false },
];

const MASCOTS = ['Freddy', 'Bonnie', 'Chica'];
const MAX_POWER = 100;
const NIGHT_DURATION = 90; // secondes pour survivre

export default function FnafGame() {
  const [phase, setPhase] = useState('intro'); // intro | game | dead | win
  const [hour, setHour] = useState(0); // 0 = 12AM, 6 = 6AM
  const [power, setPower] = useState(MAX_POWER);
  const [doorClosed, setDoorClosed] = useState(false);
  const [cameras, setCameras] = useState(CAMERAS);
  const [activeCamera, setActiveCamera] = useState(null); // null = pas en mode caméra
  const [mascotAtDoor, setMascotAtDoor] = useState(null);
  const [currentMascotCam, setCurrentMascotCam] = useState({ Freddy: 4, Bonnie: 2, Chica: 2 });
  const [flashMessage, setFlashMessage] = useState('');
  const [score, setScore] = useState(0);
  const navigate = useNavigate();
  const { jeuId } = useParams();
  const userId = localStorage.getItem('userId');
  const gameRef = useRef({ dead: false, won: false });

  const showFlash = (msg) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(''), 2000);
  };

  const saveScore = async (s) => {
    if (!userId || !jeuId) return;
    try { await scoreService.saveScore(parseInt(userId), parseInt(jeuId), s); } catch (e) {}
  };

  useEffect(() => {
    if (phase !== 'game') return;
    gameRef.current = { dead: false, won: false };

    // Timer des heures (chaque 15s = 1h, 6h = 90s)
    const hourTimer = setInterval(() => {
      setHour(h => {
        if (h >= 5) {
          if (!gameRef.current.dead) {
            gameRef.current.won = true;
            const pts = Math.round(power) * 10;
            setScore(pts);
            saveScore(pts);
            setPhase('win');
          }
          clearInterval(hourTimer);
          return h;
        }
        return h + 1;
      });
    }, 15000);

    // Consommation de puissance
    const powerTimer = setInterval(() => {
      if (gameRef.current.dead || gameRef.current.won) return;
      setPower(p => {
        const drain = doorClosed ? 2 : 0.5;
        const next = p - drain;
        if (next <= 0) {
          gameRef.current.dead = true;
          setPhase('dead');
          return 0;
        }
        return next;
      });
    }, 1000);

    // Mouvement des mascottes toutes les 8s
    const mascotTimer = setInterval(() => {
      if (gameRef.current.dead || gameRef.current.won) return;
      const mascot = MASCOTS[Math.floor(Math.random() * MASCOTS.length)];
      setCurrentMascotCam(prev => {
        const pos = prev[mascot];
        // Progression vers la porte (cam 1 = couloir gauche = danger)
        if (pos === 1) {
          // Mascotte au couloir gauche -> attaque si porte ouverte
          setMascotAtDoor(mascot);
          showFlash(`⚠️ ${mascot} est à la porte !`);
          return prev;
        }
        const next = pos === 4 ? 2 : pos === 2 ? 3 : pos === 3 ? 1 : pos;
        showFlash(`${mascot} a bougé...`);
        return { ...prev, [mascot]: next };
      });
    }, 8000);

    // Vérification attaque porte toutes les 2s
    const attackTimer = setInterval(() => {
      if (gameRef.current.dead || gameRef.current.won) return;
      setMascotAtDoor(m => {
        if (m && !doorClosed) {
          gameRef.current.dead = true;
          setPhase('dead');
        }
        return m;
      });
    }, 2000);

    return () => {
      clearInterval(hourTimer);
      clearInterval(powerTimer);
      clearInterval(mascotTimer);
      clearInterval(attackTimer);
    };
  }, [phase]);

  const toggleDoor = () => {
    setDoorClosed(d => !d);
    if (mascotAtDoor && doorClosed) {
      // On ouvre la porte alors qu'une mascotte est là
      gameRef.current.dead = true;
      setPhase('dead');
    }
  };

  const HOUR_LABELS = ['12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM'];

  return (
    <div className="fnaf-container">
      {/* INTRO */}
      {phase === 'intro' && (
        <div className="fnaf-intro">
          <h2>🍕 Freddy Fazbear's Pizza</h2>
          <p>Tu es le gardien de nuit. Surveille les caméras,<br/>ferme la porte si une mascotte approche.<br/>Survie jusqu'à 6AM !</p>
          <p className="fnaf-warning">⚡ Attention à ta consommation d'énergie !</p>
          <button className="fnaf-btn" onClick={() => setPhase('game')}>Commencer la nuit</button>
        </div>
      )}

      {/* GAME */}
      {phase === 'game' && (
        <div className="fnaf-game">
          {/* HUD */}
          <div className="fnaf-hud">
            <span>🕐 {HOUR_LABELS[hour]}</span>
            <span className={`fnaf-power ${power < 20 ? 'fnaf-power-low' : ''}`}>
              ⚡ {Math.round(power)}%
            </span>
            {doorClosed && <span className="fnaf-door-status">🔒 PORTE FERMÉE</span>}
            {mascotAtDoor && <span className="fnaf-alert">⚠️ {mascotAtDoor} À LA PORTE !</span>}
          </div>

          {/* FLASH MESSAGE */}
          {flashMessage && <div className="fnaf-flash">{flashMessage}</div>}

          {/* VUE PRINCIPALE */}
          {activeCamera === null ? (
            <div className="fnaf-office">
              <div className="fnaf-scene">
                <p className="fnaf-scene-text">🏢 Bureau de sécurité</p>
                {mascotAtDoor && (
                  <p className="fnaf-door-shadow">👾 Ombre dans le couloir...</p>
                )}
              </div>
              <div className="fnaf-controls">
                <button
                  className={`fnaf-btn ${doorClosed ? 'fnaf-btn-red' : 'fnaf-btn-green'}`}
                  onClick={toggleDoor}
                >
                  {doorClosed ? '🔓 Ouvrir porte' : '🔒 Fermer porte'}
                </button>
                <button className="fnaf-btn" onClick={() => setActiveCamera(1)}>
                  📷 Caméras
                </button>
              </div>
            </div>
          ) : (
            /* VUE CAMÉRAS */
            <div className="fnaf-cameras">
              <div className="fnaf-cam-view">
                <p className="fnaf-cam-title">{cameras[activeCamera - 1].name}</p>
                <div className="fnaf-cam-screen">
                  {Object.entries(currentMascotCam).map(([name, cam]) =>
                    cam === activeCamera ? (
                      <span key={name} className="fnaf-mascot-spotted">👾 {name}</span>
                    ) : null
                  )}
                  {!Object.values(currentMascotCam).includes(activeCamera) && (
                    <span className="fnaf-cam-empty">Rien à signaler...</span>
                  )}
                </div>
              </div>
              <div className="fnaf-cam-list">
                {CAMERAS.map(cam => (
                  <button
                    key={cam.id}
                    className={`fnaf-cam-btn ${activeCamera === cam.id ? 'fnaf-cam-active' : ''}`}
                    onClick={() => setActiveCamera(cam.id)}
                  >
                    CAM {cam.id}
                  </button>
                ))}
              </div>
              <button className="fnaf-btn" onClick={() => setActiveCamera(null)}>
                ❌ Fermer caméras
              </button>
            </div>
          )}
        </div>
      )}

      {/* DEAD */}
      {phase === 'dead' && (
        <div className="fnaf-overlay fnaf-dead">
          <h2>😱 GAME OVER</h2>
          <p>Une mascotte t'a eu...</p>
          <p>Tu as survécu jusqu'à {HOUR_LABELS[hour]}</p>
          <button className="fnaf-btn" onClick={() => { setPhase('intro'); setHour(0); setPower(100); setDoorClosed(false); setMascotAtDoor(null); setCurrentMascotCam({ Freddy: 4, Bonnie: 2, Chica: 2 }); }}>
            Réessayer
          </button>
          <button className="fnaf-btn-secondary" onClick={() => navigate('/')}>Retour</button>
        </div>
      )}

      {/* WIN */}
      {phase === 'win' && (
        <div className="fnaf-overlay fnaf-win">
          <h2>🌅 Tu as survécu !</h2>
          <p>6AM ! La nuit est terminée !</p>
          <p>Score : {score} pts ({Math.round(power)}% d'énergie restante)</p>
          <button className="fnaf-btn" onClick={() => { setPhase('intro'); setHour(0); setPower(100); setDoorClosed(false); setMascotAtDoor(null); setCurrentMascotCam({ Freddy: 4, Bonnie: 2, Chica: 2 }); }}>
            Rejouer
          </button>
          <button className="fnaf-btn-secondary" onClick={() => navigate('/')}>Retour</button>
        </div>
      )}
    </div>
  );
}